-- CreateTable
CREATE TABLE "University" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "studentLife" TEXT NOT NULL,
    "reviews" TEXT NOT NULL,
    "programs" TEXT NOT NULL,
    "statistics" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "universityId" INTEGER NOT NULL,
    "universityName" TEXT NOT NULL,
    "universityPage" TEXT,
    "statistics" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'master',
    "language" TEXT,
    "languageTest" TEXT,
    "delivered" TEXT,
    "abilities" TEXT,
    "programmeStructure" TEXT,
    "generalRequirements" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Program_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
