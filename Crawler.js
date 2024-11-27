import { CrawlingAPI } from 'crawlbase';
import fs from 'fs';
import axios from 'axios';


// Replace with your actual Crawlbase token
const api = new CrawlingAPI({ token: 'panVxST8Utk3w9mkHX2dxA' });

// Add your cookies here (replace placeholders with actual values)
const amazonCookies =
  'x-acbin=BZLMLd92UTHrsYCF5iEJ8ubUDVQNlbQhO6OQWY0YkXU878N1KWIFlQAGM4kJNSYw; at-acbin=Atza|IwEBIPwhAhvMbocfl23Y74Tu1859c25znyqsltJdqJshBH0xIYX6boASpIXoyPlf4TGMZnLVKoCnsnmaQOooOj_V5kVMp5ES1XLMjocSLQq0qyFxoA-TRDImD5Y6ZiZLT12Y6lTSIsX89HUbdtWyRISORagh9zQ2PQruhT3rKTBI0x2Fo4MfAF9MJPs_UrC7inXKldwo0TTFuve-bEToyMCR5OuJed6ghFNpXKIiSORddczzHQ';

// Function to extract ASIN from any Amazon product URL
function extractASIN(url) {
  const match = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|\/product-reviews\/([A-Z0-9]{10})/);
  return match ? match[1] || match[2] || match[3] : null;
}

// Function to construct reviews URL using the ASIN
function constructReviewsURL(asin, pageNumber = 1) {
  return `https://www.amazon.in/product-reviews/${asin}/?reviewerType=all_reviews&pageNumber=${pageNumber}`;
}

// Fetch reviews for a single page
async function fetchPage(url) {
  try {
    const response = await api.get(url, {
      scraper: 'amazon-product-reviews',
      ajax_wait: 2000, // Reduce wait time
      page_wait: 2000, // Reduce wait time
      cookies: amazonCookies,
    });

    if (response.statusCode === 200) {
      const data = response.json.body;

      // Extract only the required fields
      return data.reviews.map((review) => ({
        reviewerName: review.reviewerName,
        reviewDate: review.reviewDate,
        reviewRating: review.reviewRating,
        reviewText: review.reviewText,
      }));
    } else {
      throw new Error(`API request failed with status: ${response.statusCode}`);
    }
  } catch (error) {
    console.error(`Failed to fetch page: ${url}`);
    console.error(`Error details: ${error.message}`);
    return [];
  }
}

// Fetch reviews in parallel
async function fetchReviews(asin, targetCount = 100) {
  const batchSize = 5; // Number of pages to fetch in parallel
  const allReviews = [];
  let page = 1;

  while (allReviews.length < targetCount) {
    const urls = Array.from({ length: batchSize }, (_, i) =>
      constructReviewsURL(asin, page + i)
    );

    console.log(`Fetching pages ${page} to ${page + batchSize - 1}...`);

    const batchReviews = await Promise.all(urls.map(fetchPage));
    const flatReviews = batchReviews.flat(); // Combine all reviews from the batch

    allReviews.push(...flatReviews);

    // Stop if there are no more reviews
    if (flatReviews.length < batchSize * 10) break;

    page += batchSize;
  }

  return allReviews.slice(0, targetCount); // Return only the desired number of reviews
}

// Main function to fetch reviews
async function fetchAllReviews(productURL, targetCount = 100) {
  try {
    const asin = extractASIN(productURL);
    if (!asin) {
      throw new Error('Invalid Amazon product URL. Unable to extract ASIN.');
    }

    console.log(`Fetching reviews for ASIN: ${asin}`);
    const reviews = await fetchReviews(asin, targetCount);

    console.log('Total Reviews Fetched:', reviews.length);
    fs.writeFileSync('amazon_reviews5.json', JSON.stringify({ reviews }, null, 2));
  } catch (error) {
    console.error(`Failed to fetch reviews: ${error.message}`);
  }
}

// Replace with any Amazon product URL
const amazonProductURL = 'https://www.amazon.in/Apple-MacBook-Chip-13-inch-256GB/dp/B08N5W4NNB/ref=sr_1_1_sspa?crid=13HIYN44I5QNZ&dib=eyJ2IjoiMSJ9.CHExN13tCcFNwuIzOI3JSumjopBevXJam7V4XcYS7GcHe4B_LP6Inp_QkW4rvBcJhaIQ92ke0ocWtQtgqWE2vxKW2pkK9iKUKy07MldE9rQmckZzhsGa_CQtEeVI8x6adw4ZTYBEacdCTVeGbvBk_rKy33STBlLcUkb7LxhZXDzOKfgBUuE5wCGJDIk7XQeTmH6NwFzKtaPohKkKNgg6rW6-gjmDAovkKJDXMVH1czQ.XfzneyVqB4AA_r1bM5wV_nMtPIncQKaXT4J_azCzipI&dib_tag=se&keywords=macbook+m1&qid=1732524871&sprefix=macboo%2Caps%2C409&sr=8-1-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1';
fetchAllReviews(amazonProductURL, 100); // Fetch up to 100 reviews