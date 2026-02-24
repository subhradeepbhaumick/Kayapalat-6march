-- Create product_details table
CREATE TABLE IF NOT EXISTS product_details (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    dealer_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    short_description VARCHAR(500),
    about_product TEXT,
    product_type ENUM('sqft', 'unit') DEFAULT 'unit',
    mrp DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_percentage DECIMAL(5,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    gst_percentage DECIMAL(5,2) DEFAULT 0.00,
    gst_amount DECIMAL(10,2) DEFAULT 0.00,
    transportation_cost DECIMAL(10,2) DEFAULT 0.00,
    base_mrp DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_product_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dealer_id (dealer_id),
    INDEX idx_category (category),
    INDEX idx_product_type (product_type),
    INDEX idx_is_active (is_active)
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    dealer_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_alt_text VARCHAR(255),
    is_primary TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product_id (product_id),
    INDEX idx_dealer_id (dealer_id),
    INDEX idx_is_primary (is_primary),
    FOREIGN KEY (product_id) REFERENCES product_details(product_id) ON DELETE CASCADE
);
