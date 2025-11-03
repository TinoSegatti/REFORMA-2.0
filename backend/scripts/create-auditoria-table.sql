-- Script para crear la tabla t_auditoria si no existe

CREATE TABLE IF NOT EXISTS public.t_auditoria (
  id VARCHAR(255) PRIMARY KEY,
  id_usuario VARCHAR(255) NOT NULL,
  id_granja VARCHAR(255),
  tabla_origen VARCHAR(50) NOT NULL,
  id_registro VARCHAR(255) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  descripcion TEXT,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  fecha_operacion TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(255),
  user_agent VARCHAR(500),
  
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES public.t_usuarios(id),
  CONSTRAINT fk_auditoria_granja FOREIGN KEY (id_granja) REFERENCES public.t_granja(id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON public.t_auditoria(id_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_granja ON public.t_auditoria(id_granja);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_origen ON public.t_auditoria(tabla_origen);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON public.t_auditoria(fecha_operacion);

