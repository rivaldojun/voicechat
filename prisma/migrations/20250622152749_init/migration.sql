-- CreateTable
CREATE TABLE "University" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "studentLife" TEXT NOT NULL,
    "reviews" TEXT NOT NULL,
    "programs" TEXT NOT NULL,
    "statistics" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "embedding" DOUBLE PRECISION[],

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partner" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "embedding" DOUBLE PRECISION[],

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
