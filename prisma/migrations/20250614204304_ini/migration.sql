/*
  Warnings:

  - Added the required column `modality` to the `Program` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "universityId" INTEGER NOT NULL,
    "universityName" TEXT NOT NULL,
    "universityPage" TEXT,
    "statistics" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'master',
    "modality" TEXT NOT NULL,
    "language" TEXT,
    "scholarships" TEXT,
    "languageTest" TEXT,
    "delivered" TEXT,
    "abilities" TEXT,
    "StudyDescription" TEXT,
    "programmeStructure" TEXT,
    "generalRequirements" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Program_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("StudyDescription", "abilities", "about", "createdAt", "delivered", "generalRequirements", "id", "language", "languageTest", "programmeStructure", "scholarships", "statistics", "title", "type", "universityId", "universityName", "universityPage", "updatedAt") SELECT "StudyDescription", "abilities", "about", "createdAt", "delivered", "generalRequirements", "id", "language", "languageTest", "programmeStructure", "scholarships", "statistics", "title", "type", "universityId", "universityName", "universityPage", "updatedAt" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
