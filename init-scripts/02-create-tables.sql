-- IoT Devices Table
CREATE TABLE IF NOT EXISTS iot_devices (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    device_id TEXT NOT NULL UNIQUE,
    device_type TEXT NOT NULL CHECK (device_type IN ('CREATOR', 'BURNER')),
    location TEXT NOT NULL,
    project_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Device Data Table
CREATE TABLE IF NOT EXISTS device_data (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    device_id TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    co2_value DECIMAL(10,2) NOT NULL,
    energy_value DECIMAL(10,2) NOT NULL,
    temperature DECIMAL(5,2) NOT NULL,
    humidity DECIMAL(5,2) NOT NULL,
    data_hash TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Carbon Credit Transactions Table
CREATE TABLE IF NOT EXISTS carbon_credit_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    device_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('MINT', 'BURN')),
    amount DECIMAL(18,8) NOT NULL,
    blockchain_tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    data JSONB,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_iot_devices_device_id ON iot_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_device_type ON iot_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_iot_devices_is_active ON iot_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_device_data_device_id ON device_data(device_id);
CREATE INDEX IF NOT EXISTS idx_device_data_timestamp ON device_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_carbon_credit_transactions_device_id ON carbon_credit_transactions(device_id);
CREATE INDEX IF NOT EXISTS idx_carbon_credit_transactions_status ON carbon_credit_transactions(status);

-- Add foreign key constraints
ALTER TABLE device_data ADD CONSTRAINT fk_device_data_device_id 
    FOREIGN KEY (device_id) REFERENCES iot_devices(device_id) ON DELETE CASCADE;

ALTER TABLE carbon_credit_transactions ADD CONSTRAINT fk_carbon_credit_transactions_device_id 
    FOREIGN KEY (device_id) REFERENCES iot_devices(device_id) ON DELETE CASCADE;
