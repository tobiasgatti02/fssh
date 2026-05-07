-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "user_code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "matriculation" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "wing" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "door" INTEGER NOT NULL,
    "user_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Machine_name_key" ON "Machine"("name");

-- CreateIndex
CREATE INDEX "Reservation_user_code_week_id_idx" ON "Reservation"("user_code", "week_id");

-- CreateIndex
CREATE INDEX "Reservation_user_id_week_id_idx" ON "Reservation"("user_id", "week_id");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_machine_id_day_hour_week_id_key" ON "Reservation"("machine_id", "day", "hour", "week_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_matriculation_key" ON "User"("matriculation");

-- CreateIndex
CREATE UNIQUE INDEX "User_user_code_key" ON "User"("user_code");

-- CreateIndex
CREATE INDEX "User_wing_floor_door_idx" ON "User"("wing", "floor", "door");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE INDEX "Session_expires_at_idx" ON "Session"("expires_at");

-- CreateIndex
CREATE INDEX "UserAction_user_id_created_at_idx" ON "UserAction"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
