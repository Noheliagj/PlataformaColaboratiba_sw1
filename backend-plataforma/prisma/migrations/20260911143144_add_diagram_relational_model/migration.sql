-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'PROTECTED', 'PACKAGE');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('ASSOCIATION', 'INHERITANCE');

-- CreateTable
CREATE TABLE "diagrams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Diagrama principal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "diagrams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "diagramId" TEXT NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attributes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'String',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "classId" TEXT NOT NULL,

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "returnType" TEXT NOT NULL DEFAULT 'void',
    "parameters" TEXT NOT NULL DEFAULT '',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "classId" TEXT NOT NULL,

    CONSTRAINT "methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" TEXT NOT NULL,
    "type" "RelationshipType" NOT NULL DEFAULT 'ASSOCIATION',
    "name" TEXT,
    "sourceCardinality" TEXT,
    "targetCardinality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagramId" TEXT NOT NULL,
    "sourceClassId" TEXT NOT NULL,
    "targetClassId" TEXT NOT NULL,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diagrams_projectId_key" ON "diagrams"("projectId");

-- CreateIndex
CREATE INDEX "classes_diagramId_idx" ON "classes"("diagramId");

-- CreateIndex
CREATE INDEX "attributes_classId_idx" ON "attributes"("classId");

-- CreateIndex
CREATE INDEX "methods_classId_idx" ON "methods"("classId");

-- CreateIndex
CREATE INDEX "relationships_diagramId_idx" ON "relationships"("diagramId");

-- AddForeignKey
ALTER TABLE "diagrams" ADD CONSTRAINT "diagrams_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "methods" ADD CONSTRAINT "methods_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_sourceClassId_fkey" FOREIGN KEY ("sourceClassId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_targetClassId_fkey" FOREIGN KEY ("targetClassId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

