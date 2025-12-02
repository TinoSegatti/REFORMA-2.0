-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('CLIENTE', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "PlanSuscripcion" AS ENUM ('PLAN_0', 'PLAN_1', 'PLAN_2', 'PLAN_3', 'PLAN_4');

-- CreateEnum
CREATE TYPE "CategoriaAnimal" AS ENUM ('LACTANCIA', 'DESTETE', 'CRECIMIENTO', 'ENGORDE', 'REPRODUCTOR', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoFabricacion" AS ENUM ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TablaOrigen" AS ENUM ('INVENTARIO', 'FABRICACION', 'COMPRA');

-- CreateTable
CREATE TABLE "t_usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "nombreUsuario" TEXT NOT NULL,
    "apellidoUsuario" TEXT NOT NULL,
    "tipoUsuario" "TipoUsuario" NOT NULL DEFAULT 'CLIENTE',
    "planSuscripcion" "PlanSuscripcion" NOT NULL DEFAULT 'PLAN_0',
    "maxGranjas" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_granja" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "nombreGranja" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_granja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_materia_prima" (
    "id" TEXT NOT NULL,
    "idGranja" TEXT NOT NULL,
    "codigoMateriaPrima" TEXT NOT NULL,
    "nombreMateriaPrima" TEXT NOT NULL,
    "precioPorKilo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUltimaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_materia_prima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_proveedor" (
    "id" TEXT NOT NULL,
    "idGranja" TEXT NOT NULL,
    "codigoProveedor" TEXT NOT NULL,
    "nombreProveedor" TEXT NOT NULL,
    "direccion" TEXT,
    "localidad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_animal" (
    "id" TEXT NOT NULL,
    "idGranja" TEXT NOT NULL,
    "codigoAnimal" TEXT NOT NULL,
    "descripcionAnimal" TEXT NOT NULL,
    "categoriaAnimal" "CategoriaAnimal" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_formula_cabecera" (
    "id" TEXT NOT NULL,
    "idGranja" TEXT NOT NULL,
    "idAnimal" TEXT NOT NULL,
    "codigoFormula" TEXT NOT NULL,
    "descripcionFormula" TEXT NOT NULL,
    "pesoTotalFormula" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "costoTotalFormula" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUltimaModificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_formula_cabecera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_formula_detalle" (
    "id" TEXT NOT NULL,
    "idFormula" TEXT NOT NULL,
    "idMateriaPrima" TEXT NOT NULL,
    "cantidadKg" DOUBLE PRECISION NOT NULL,
    "porcentajeFormula" DOUBLE PRECISION NOT NULL,
    "precioUnitarioMomentoCreacion" DOUBLE PRECISION NOT NULL,
    "costoParcial" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "t_formula_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_fabricacion" (
    "id" TEXT NOT NULL,
    "idGranja" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "idFormula" TEXT NOT NULL,
    "descripcionFabricacion" TEXT NOT NULL,
    "cantidadFabricacion" DOUBLE PRECISION NOT NULL,
    "costoTotalFabricacion" DOUBLE PRECISION NOT NULL,
    "costoPorKilo" DOUBLE PRECISION NOT NULL,
    "fechaFabricacion" TIMESTAMP(3) NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoFabricacion" NOT NULL DEFAULT 'PROGRAMADA',

    CONSTRAINT "t_fabricacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_detalle_fabricacion" (
    "id" TEXT NOT NULL,
    "idFabricacion" TEXT NOT NULL,
    "idMateriaPrima" TEXT NOT NULL,
    "cantidadUsada" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "costoParcial" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "t_detalle_fabricacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_inventario" (
    "id" TEXT NOT NULL,
    "idGranja" TEXT NOT NULL,
    "idMateriaPrima" TEXT NOT NULL,
    "cantidadAcumulada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cantidadSistema" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cantidadReal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "merma" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioAlmacen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaUltimaActualizacion" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "t_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_compra_cabecera" (
    "id" TEXT NOT NULL,
    "idGranja" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "idProveedor" TEXT NOT NULL,
    "numeroFactura" TEXT,
    "fechaCompra" TIMESTAMP(3) NOT NULL,
    "totalFactura" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_compra_cabecera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_compra_detalle" (
    "id" TEXT NOT NULL,
    "idCompra" TEXT NOT NULL,
    "idMateriaPrima" TEXT NOT NULL,
    "cantidadComprada" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "precioAnteriorMateriaPrima" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "t_compra_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_registro_precio" (
    "id" TEXT NOT NULL,
    "idMateriaPrima" TEXT NOT NULL,
    "precioAnterior" DOUBLE PRECISION NOT NULL,
    "precioNuevo" DOUBLE PRECISION NOT NULL,
    "diferenciaPorcentual" DOUBLE PRECISION NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,

    CONSTRAINT "t_registro_precio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_archivo_cabecera" (
    "id" TEXT NOT NULL,
    "idGranja" TEXT NOT NULL,
    "tablaOrigen" "TablaOrigen" NOT NULL,
    "fechaArchivo" TIMESTAMP(3) NOT NULL,
    "descripcionArchivo" TEXT NOT NULL,
    "totalRegistros" INTEGER NOT NULL DEFAULT 0,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_archivo_cabecera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_archivo_detalle" (
    "id" TEXT NOT NULL,
    "idArchivo" TEXT NOT NULL,
    "datosJson" JSONB NOT NULL,

    CONSTRAINT "t_archivo_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_usuarios_email_key" ON "t_usuarios"("email");

-- CreateIndex
CREATE INDEX "t_granja_idUsuario_idx" ON "t_granja"("idUsuario");

-- CreateIndex
CREATE INDEX "t_materia_prima_idGranja_idx" ON "t_materia_prima"("idGranja");

-- CreateIndex
CREATE UNIQUE INDEX "t_materia_prima_idGranja_codigoMateriaPrima_key" ON "t_materia_prima"("idGranja", "codigoMateriaPrima");

-- CreateIndex
CREATE INDEX "t_proveedor_idGranja_idx" ON "t_proveedor"("idGranja");

-- CreateIndex
CREATE UNIQUE INDEX "t_proveedor_idGranja_codigoProveedor_key" ON "t_proveedor"("idGranja", "codigoProveedor");

-- CreateIndex
CREATE INDEX "t_animal_idGranja_idx" ON "t_animal"("idGranja");

-- CreateIndex
CREATE UNIQUE INDEX "t_animal_idGranja_codigoAnimal_key" ON "t_animal"("idGranja", "codigoAnimal");

-- CreateIndex
CREATE INDEX "t_formula_cabecera_idGranja_idx" ON "t_formula_cabecera"("idGranja");

-- CreateIndex
CREATE UNIQUE INDEX "t_formula_cabecera_idGranja_codigoFormula_key" ON "t_formula_cabecera"("idGranja", "codigoFormula");

-- CreateIndex
CREATE INDEX "t_formula_detalle_idFormula_idx" ON "t_formula_detalle"("idFormula");

-- CreateIndex
CREATE INDEX "t_formula_detalle_idMateriaPrima_idx" ON "t_formula_detalle"("idMateriaPrima");

-- CreateIndex
CREATE INDEX "t_fabricacion_idGranja_idx" ON "t_fabricacion"("idGranja");

-- CreateIndex
CREATE INDEX "t_fabricacion_idUsuario_idx" ON "t_fabricacion"("idUsuario");

-- CreateIndex
CREATE INDEX "t_fabricacion_idFormula_idx" ON "t_fabricacion"("idFormula");

-- CreateIndex
CREATE INDEX "t_detalle_fabricacion_idFabricacion_idx" ON "t_detalle_fabricacion"("idFabricacion");

-- CreateIndex
CREATE INDEX "t_detalle_fabricacion_idMateriaPrima_idx" ON "t_detalle_fabricacion"("idMateriaPrima");

-- CreateIndex
CREATE INDEX "t_inventario_idGranja_idx" ON "t_inventario"("idGranja");

-- CreateIndex
CREATE UNIQUE INDEX "t_inventario_idGranja_idMateriaPrima_key" ON "t_inventario"("idGranja", "idMateriaPrima");

-- CreateIndex
CREATE INDEX "t_compra_cabecera_idGranja_idx" ON "t_compra_cabecera"("idGranja");

-- CreateIndex
CREATE INDEX "t_compra_cabecera_idUsuario_idx" ON "t_compra_cabecera"("idUsuario");

-- CreateIndex
CREATE INDEX "t_compra_cabecera_idProveedor_idx" ON "t_compra_cabecera"("idProveedor");

-- CreateIndex
CREATE INDEX "t_compra_detalle_idCompra_idx" ON "t_compra_detalle"("idCompra");

-- CreateIndex
CREATE INDEX "t_compra_detalle_idMateriaPrima_idx" ON "t_compra_detalle"("idMateriaPrima");

-- CreateIndex
CREATE INDEX "t_registro_precio_idMateriaPrima_idx" ON "t_registro_precio"("idMateriaPrima");

-- CreateIndex
CREATE INDEX "t_registro_precio_fechaCambio_idx" ON "t_registro_precio"("fechaCambio");

-- CreateIndex
CREATE INDEX "t_archivo_cabecera_idGranja_idx" ON "t_archivo_cabecera"("idGranja");

-- CreateIndex
CREATE INDEX "t_archivo_cabecera_tablaOrigen_idx" ON "t_archivo_cabecera"("tablaOrigen");

-- CreateIndex
CREATE INDEX "t_archivo_detalle_idArchivo_idx" ON "t_archivo_detalle"("idArchivo");

-- AddForeignKey
ALTER TABLE "t_granja" ADD CONSTRAINT "t_granja_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "t_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_materia_prima" ADD CONSTRAINT "t_materia_prima_idGranja_fkey" FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_proveedor" ADD CONSTRAINT "t_proveedor_idGranja_fkey" FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_animal" ADD CONSTRAINT "t_animal_idGranja_fkey" FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_formula_cabecera" ADD CONSTRAINT "t_formula_cabecera_idGranja_fkey" FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_formula_cabecera" ADD CONSTRAINT "t_formula_cabecera_idAnimal_fkey" FOREIGN KEY ("idAnimal") REFERENCES "t_animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_formula_detalle" ADD CONSTRAINT "t_formula_detalle_idFormula_fkey" FOREIGN KEY ("idFormula") REFERENCES "t_formula_cabecera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_formula_detalle" ADD CONSTRAINT "t_formula_detalle_idMateriaPrima_fkey" FOREIGN KEY ("idMateriaPrima") REFERENCES "t_materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_fabricacion" ADD CONSTRAINT "t_fabricacion_idGranja_fkey" FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_fabricacion" ADD CONSTRAINT "t_fabricacion_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "t_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_fabricacion" ADD CONSTRAINT "t_fabricacion_idFormula_fkey" FOREIGN KEY ("idFormula") REFERENCES "t_formula_cabecera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_detalle_fabricacion" ADD CONSTRAINT "t_detalle_fabricacion_idFabricacion_fkey" FOREIGN KEY ("idFabricacion") REFERENCES "t_fabricacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_detalle_fabricacion" ADD CONSTRAINT "t_detalle_fabricacion_idMateriaPrima_fkey" FOREIGN KEY ("idMateriaPrima") REFERENCES "t_materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inventario" ADD CONSTRAINT "t_inventario_idGranja_fkey" FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_inventario" ADD CONSTRAINT "t_inventario_idMateriaPrima_fkey" FOREIGN KEY ("idMateriaPrima") REFERENCES "t_materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_compra_cabecera" ADD CONSTRAINT "t_compra_cabecera_idGranja_fkey" FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_compra_cabecera" ADD CONSTRAINT "t_compra_cabecera_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "t_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_compra_cabecera" ADD CONSTRAINT "t_compra_cabecera_idProveedor_fkey" FOREIGN KEY ("idProveedor") REFERENCES "t_proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_compra_detalle" ADD CONSTRAINT "t_compra_detalle_idCompra_fkey" FOREIGN KEY ("idCompra") REFERENCES "t_compra_cabecera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_compra_detalle" ADD CONSTRAINT "t_compra_detalle_idMateriaPrima_fkey" FOREIGN KEY ("idMateriaPrima") REFERENCES "t_materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_registro_precio" ADD CONSTRAINT "t_registro_precio_idMateriaPrima_fkey" FOREIGN KEY ("idMateriaPrima") REFERENCES "t_materia_prima"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_archivo_cabecera" ADD CONSTRAINT "t_archivo_cabecera_idGranja_fkey" FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_archivo_detalle" ADD CONSTRAINT "t_archivo_detalle_idArchivo_fkey" FOREIGN KEY ("idArchivo") REFERENCES "t_archivo_cabecera"("id") ON DELETE CASCADE ON UPDATE CASCADE;
