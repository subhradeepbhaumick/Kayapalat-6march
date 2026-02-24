-- Create defective_product_images table for storing damage proof images
CREATE TABLE IF NOT EXISTS defective_product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  image_alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key constraint (assuming products table exists)
  CONSTRAINT fk_defective_product_images_product_id
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- Indexes for better performance
  INDEX idx_product_id (product_id),
  INDEX idx_is_primary (is_primary),
  INDEX idx_sort_order (sort_order),
  INDEX idx_created_at (created_at)
);

-- Add comment to table
ALTER TABLE defective_product_images COMMENT 'Stores damage proof images for products with issues';
