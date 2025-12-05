/*
  Warnings:

  - You are about to drop the column `userId` on the `Character` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- Delete all existing messages and characters since we're making character ownership user-specific
DELETE FROM "Message";
DELETE FROM "Character";

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
