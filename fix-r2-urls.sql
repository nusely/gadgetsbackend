-- Fix R2 URLs in database
-- Run this in Supabase SQL Editor to update existing image URLs

-- Fix brand logos
UPDATE brands
SET logo_url = REPLACE(
  logo_url, 
  'https://ventech-images.a9380daec985adef210d27ca408143da.r2.cloudflarestorage.com/',
  'https://a9380daec985adef210d27ca408143da.r2.dev/ventech-images/'
)
WHERE logo_url LIKE '%r2.cloudflarestorage.com%';

-- Fix category images (using image_url column)
UPDATE categories
SET image_url = REPLACE(
  image_url,
  'https://ventech-images.a9380daec985adef210d27ca408143da.r2.cloudflarestorage.com/',
  'https://a9380daec985adef210d27ca408143da.r2.dev/ventech-images/'
)
WHERE image_url LIKE '%r2.cloudflarestorage.com%';

-- Fix banner images
UPDATE banners
SET image_url = REPLACE(
  image_url,
  'https://ventech-images.a9380daec985adef210d27ca408143da.r2.cloudflarestorage.com/',
  'https://a9380daec985adef210d27ca408143da.r2.dev/ventech-images/'
)
WHERE image_url LIKE '%r2.cloudflarestorage.com%';

-- Fix product images (thumbnail and images array)
UPDATE products
SET thumbnail = REPLACE(
  thumbnail,
  'https://ventech-images.a9380daec985adef210d27ca408143da.r2.cloudflarestorage.com/',
  'https://a9380daec985adef210d27ca408143da.r2.dev/ventech-images/'
)
WHERE thumbnail LIKE '%r2.cloudflarestorage.com%';

-- Fix product images array
UPDATE products
SET images = (
  SELECT array_agg(
    REPLACE(
      img,
      'https://ventech-images.a9380daec985adef210d27ca408143da.r2.cloudflarestorage.com/',
      'https://a9380daec985adef210d27ca408143da.r2.dev/ventech-images/'
    )
  )
  FROM unnest(images) AS img
)
WHERE EXISTS (
  SELECT 1 FROM unnest(images) AS img
  WHERE img LIKE '%r2.cloudflarestorage.com%'
);

-- Display results
SELECT 'Brands updated:' as type, COUNT(*) as count FROM brands WHERE logo_url LIKE '%r2.dev%'
UNION ALL
SELECT 'Categories updated:', COUNT(*) FROM categories WHERE image_url LIKE '%r2.dev%'
UNION ALL
SELECT 'Banners updated:', COUNT(*) FROM banners WHERE image_url LIKE '%r2.dev%'
UNION ALL
SELECT 'Products updated:', COUNT(*) FROM products WHERE thumbnail LIKE '%r2.dev%';

