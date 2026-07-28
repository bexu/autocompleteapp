-- CreateTable
CREATE TABLE "rate_limit_window" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limit_window_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateIndex
CREATE INDEX "rate_limit_window_windowStart_idx" ON "rate_limit_window"("windowStart");
