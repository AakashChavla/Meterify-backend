-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "pricing_tier" TEXT NOT NULL DEFAULT 'FREE',
    "rate_limit" INTEGER NOT NULL DEFAULT 1000,
    "rate_limit_window" INTEGER NOT NULL DEFAULT 3600,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_endpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_usage_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_code" INTEGER NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "request_size" INTEGER,
    "response_size" INTEGER,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "error_message" TEXT,
    CONSTRAINT "api_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "api_usage_logs_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "api_endpoints" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "monthly_usage_summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "month_year" TEXT NOT NULL,
    "total_calls" INTEGER NOT NULL DEFAULT 0,
    "successful_calls" INTEGER NOT NULL DEFAULT 0,
    "failed_calls" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time" REAL NOT NULL DEFAULT 0,
    "total_data_transfer" BIGINT NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "monthly_usage_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "billing_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "month_year" TEXT NOT NULL,
    "total_calls" INTEGER NOT NULL,
    "bill_amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "due_date" DATETIME NOT NULL,
    "paid_at" DATETIME,
    "generated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "billing_invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pricing_tiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rate_limit" INTEGER NOT NULL,
    "rate_limit_window" INTEGER NOT NULL,
    "price_per_1000_calls" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rate_limit_tracker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "window_start" DATETIME NOT NULL,
    "request_count" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_api_key_key" ON "users"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "api_endpoints_path_method_key" ON "api_endpoints"("path", "method");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_usage_summary_user_id_month_year_key" ON "monthly_usage_summary"("user_id", "month_year");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_user_id_month_year_key" ON "billing_invoices"("user_id", "month_year");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_tiers_name_key" ON "pricing_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_tracker_user_id_window_start_key" ON "rate_limit_tracker"("user_id", "window_start");
