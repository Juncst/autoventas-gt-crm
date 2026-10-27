-- =========================================================
-- DATOS DE PRUEBA - AUTOVENTAS GT
-- Clientes, Prospectos, Notas y Actividades
-- =========================================================


-- =========================================================
-- 1. CLIENTES
-- =========================================================

INSERT INTO public.clientes
(codigo, nombre, nit, telefono, correo, tipo, asesor, estado,
 direccion, observaciones)
VALUES

('CLI-001',
 'Carlos Méndez',
 '5487963-2',
 '5551-1020',
 'carlos.mendez@email.com',
 'Individual',
 'José Castañeda',
 'Activo',
 'Zona 10, Ciudad de Guatemala',
 'Cliente interesado en vehículos SUV.'),

('CLI-002',
 'Ana Lucía Herrera',
 '7348956-1',
 '5552-2030',
 'ana.herrera@email.com',
 'Individual',
 'Francis Zeceña',
 'Activo',
 'Zona 15, Ciudad de Guatemala',
 'Ha realizado consultas por vehículos compactos.'),

('CLI-003',
 'Transportes del Norte, S.A.',
 '9632587-4',
 '2225-4400',
 'compras@transportesnorte.gt',
 'Empresa',
 'Alejandro Alvarez',
 'Activo',
 'Zona 12, Ciudad de Guatemala',
 'Empresa interesada en ampliar su flotilla.'),

('CLI-004',
 'María Fernanda López',
 '4578963-8',
 '5553-3040',
 'maria.lopez@email.com',
 'Individual',
 'José Castañeda',
 'Activo',
 'Mixco, Guatemala',
 'Busca vehículo automático para uso diario.'),

('CLI-005',
 'Servicios Industriales GT',
 '8754123-9',
 '2298-7700',
 'administracion@sigT.gt',
 'Empresa',
 'Francis Zeceña',
 'Activo',
 'Villa Nueva, Guatemala',
 'Cliente empresarial interesado en pickups.'),

('CLI-006',
 'Luis Fernando Castillo',
 '3698521-7',
 '5554-4050',
 'luis.castillo@email.com',
 'Individual',
 'Alejandro Alvarez',
 'Activo',
 'Zona 7, Ciudad de Guatemala',
 'Cliente interesado en vehículo familiar.'),

('CLI-007',
 'Andrea Morales',
 '7896541-3',
 '5555-5060',
 'andrea.morales@email.com',
 'Individual',
 'Francis Zeceña',
 'Activo',
 'Zona 11, Ciudad de Guatemala',
 'Prefiere vehículos recientes y de bajo consumo.'),

('CLI-008',
 'Constructora El Roble, S.A.',
 '1597534-6',
 '2388-9900',
 'compras@elroble.gt',
 'Empresa',
 'José Castañeda',
 'Activo',
 'Carretera a El Salvador, Guatemala',
 'Busca vehículos de trabajo para supervisores.')

ON CONFLICT (codigo) DO NOTHING;



-- =========================================================
-- 2. PROSPECTOS
-- =========================================================

INSERT INTO public.prospectos
(codigo, nombre, descripcion, telefono, correo,
 vehiculo, detalle_vehiculo, asesor, estado,
 observaciones, precio, fecha_cierre)
VALUES

('PRO-001',
 'Diego Ramírez',
 'Prospecto interesado en SUV para uso familiar.',
 '5556-1001',
 'diego.ramirez@email.com',
 'Toyota RAV4',
 'Toyota RAV4 2025 Automática',
 'José Castañeda',
 'Nuevo',
 'Solicitó información inicial.',
 265000.00,
 NULL),

('PRO-002',
 'Gabriela Fuentes',
 'Busca vehículo compacto y económico.',
 '5556-1002',
 'gabriela.fuentes@email.com',
 'Toyota Corolla',
 'Toyota Corolla 2025 Automático',
 'Francis Zeceña',
 'Contactado',
 'Se envió información por correo.',
 185000.00,
 NULL),

('PRO-003',
 'Roberto Aguilar',
 'Interesado en pickup para trabajo.',
 '5556-1003',
 'roberto.aguilar@email.com',
 'Toyota Hilux',
 'Toyota Hilux 2025 4x4',
 'Alejandro Alvarez',
 'Negociación',
 'Pendiente confirmar forma de pago.',
 315000.00,
 NULL),

('PRO-004',
 'Paola Martínez',
 'Busca SUV compacto.',
 '5556-1004',
 'paola.martinez@email.com',
 'Hyundai Tucson',
 'Hyundai Tucson 2025',
 'José Castañeda',
 'Contactado',
 'Solicitó prueba de manejo.',
 245000.00,
 NULL),

('PRO-005',
 'Grupo Logístico Maya',
 'Empresa interesada en adquirir vehículos de flotilla.',
 '2278-6600',
 'compras@logisticamaya.gt',
 'Toyota Hilux',
 'Toyota Hilux 4x2 para flotilla',
 'Francis Zeceña',
 'Negociación',
 'Cotización empresarial pendiente de aprobación.',
 295000.00,
 NULL),

('PRO-006',
 'Marco Antonio Reyes',
 'Interesado en sedán para uso personal.',
 '5556-1006',
 'marco.reyes@email.com',
 'Honda Civic',
 'Honda Civic Touring 2025',
 'Alejandro Alvarez',
 'Ganado',
 'Prospecto convertido exitosamente.',
 235000.00,
 CURRENT_TIMESTAMP),

('PRO-007',
 'Sofía Hernández',
 'Busca vehículo familiar con buen espacio interior.',
 '5556-1007',
 'sofia.hernandez@email.com',
 'Kia Sportage',
 'Kia Sportage 2025',
 'José Castañeda',
 'Nuevo',
 'Primer contacto pendiente.',
 225000.00,
 NULL),

('PRO-008',
 'Fernando Morales',
 'Buscaba pickup pero decidió posponer la compra.',
 '5556-1008',
 'fernando.morales@email.com',
 'Ford Ranger',
 'Ford Ranger 2025',
 'Francis Zeceña',
 'Perdido',
 'Cliente pospuso la compra para el próximo año.',
 325000.00,
 CURRENT_TIMESTAMP)

ON CONFLICT (codigo) DO NOTHING;



-- =========================================================
-- 3. NOTAS DE PROSPECTOS
-- =========================================================

INSERT INTO public.notas_prospectos (prospecto_id, contenido)
SELECT id, 'Cliente solicita información sobre opciones de financiamiento.'
FROM public.prospectos
WHERE codigo = 'PRO-001'
AND NOT EXISTS (
    SELECT 1
    FROM public.notas_prospectos n
    WHERE n.prospecto_id = prospectos.id
      AND n.contenido = 'Cliente solicita información sobre opciones de financiamiento.'
);


INSERT INTO public.notas_prospectos (prospecto_id, contenido)
SELECT id, 'Se envió ficha técnica y precio del vehículo.'
FROM public.prospectos
WHERE codigo = 'PRO-002'
AND NOT EXISTS (
    SELECT 1
    FROM public.notas_prospectos n
    WHERE n.prospecto_id = prospectos.id
      AND n.contenido = 'Se envió ficha técnica y precio del vehículo.'
);


INSERT INTO public.notas_prospectos (prospecto_id, contenido)
SELECT id, 'Cliente solicita evaluar descuento por pago de contado.'
FROM public.prospectos
WHERE codigo = 'PRO-003'
AND NOT EXISTS (
    SELECT 1
    FROM public.notas_prospectos n
    WHERE n.prospecto_id = prospectos.id
      AND n.contenido = 'Cliente solicita evaluar descuento por pago de contado.'
);


INSERT INTO public.notas_prospectos (prospecto_id, contenido)
SELECT id, 'Se coordinó prueba de manejo para esta semana.'
FROM public.prospectos
WHERE codigo = 'PRO-004'
AND NOT EXISTS (
    SELECT 1
    FROM public.notas_prospectos n
    WHERE n.prospecto_id = prospectos.id
      AND n.contenido = 'Se coordinó prueba de manejo para esta semana.'
);


INSERT INTO public.notas_prospectos (prospecto_id, contenido)
SELECT id, 'Empresa solicita propuesta por varias unidades.'
FROM public.prospectos
WHERE codigo = 'PRO-005'
AND NOT EXISTS (
    SELECT 1
    FROM public.notas_prospectos n
    WHERE n.prospecto_id = prospectos.id
      AND n.contenido = 'Empresa solicita propuesta por varias unidades.'
);



-- =========================================================
-- 4. ACTIVIDADES DE PROSPECTOS
-- =========================================================

INSERT INTO public.actividades_prospectos
(prospecto_id, tipo, titulo, descripcion)
SELECT
    id,
    'Llamada',
    'Primer contacto',
    'Se realizó llamada inicial para conocer las necesidades del prospecto.'
FROM public.prospectos
WHERE codigo = 'PRO-001'
AND NOT EXISTS (
    SELECT 1
    FROM public.actividades_prospectos a
    WHERE a.prospecto_id = prospectos.id
      AND a.titulo = 'Primer contacto'
);


INSERT INTO public.actividades_prospectos
(prospecto_id, tipo, titulo, descripcion)
SELECT
    id,
    'Correo',
    'Envío de información',
    'Se enviaron precios, especificaciones y opciones disponibles.'
FROM public.prospectos
WHERE codigo = 'PRO-002'
AND NOT EXISTS (
    SELECT 1
    FROM public.actividades_prospectos a
    WHERE a.prospecto_id = prospectos.id
      AND a.titulo = 'Envío de información'
);


INSERT INTO public.actividades_prospectos
(prospecto_id, tipo, titulo, descripcion)
SELECT
    id,
    'Reunión',
    'Negociación comercial',
    'Se discutieron precio, financiamiento y condiciones de compra.'
FROM public.prospectos
WHERE codigo = 'PRO-003'
AND NOT EXISTS (
    SELECT 1
    FROM public.actividades_prospectos a
    WHERE a.prospecto_id = prospectos.id
      AND a.titulo = 'Negociación comercial'
);


INSERT INTO public.actividades_prospectos
(prospecto_id, tipo, titulo, descripcion)
SELECT
    id,
    'Seguimiento',
    'Prueba de manejo',
    'Se programó una prueba de manejo del vehículo seleccionado.'
FROM public.prospectos
WHERE codigo = 'PRO-004'
AND NOT EXISTS (
    SELECT 1
    FROM public.actividades_prospectos a
    WHERE a.prospecto_id = prospectos.id
      AND a.titulo = 'Prueba de manejo'
);


INSERT INTO public.actividades_prospectos
(prospecto_id, tipo, titulo, descripcion)
SELECT
    id,
    'Cotización',
    'Propuesta empresarial',
    'Se preparó propuesta comercial para adquisición de varias unidades.'
FROM public.prospectos
WHERE codigo = 'PRO-005'
AND NOT EXISTS (
    SELECT 1
    FROM public.actividades_prospectos a
    WHERE a.prospecto_id = prospectos.id
      AND a.titulo = 'Propuesta empresarial'
);


INSERT INTO public.actividades_prospectos
(prospecto_id, tipo, titulo, descripcion)
SELECT
    id,
    'Venta',
    'Negociación finalizada',
    'El prospecto aceptó la propuesta comercial.'
FROM public.prospectos
WHERE codigo = 'PRO-006'
AND NOT EXISTS (
    SELECT 1
    FROM public.actividades_prospectos a
    WHERE a.prospecto_id = prospectos.id
      AND a.titulo = 'Negociación finalizada'
);



-- =========================================================
-- 5. COMPROBAR RESULTADOS
-- =========================================================

SELECT
    id,
    codigo,
    nombre,
    tipo,
    asesor,
    estado
FROM public.clientes
ORDER BY id;


SELECT
    id,
    codigo,
    nombre,
    vehiculo,
    asesor,
    estado,
    precio
FROM public.prospectos
ORDER BY id;


SELECT
    p.codigo,
    p.nombre,
    n.contenido,
    n.fecha
FROM public.notas_prospectos n
JOIN public.prospectos p
    ON p.id = n.prospecto_id
ORDER BY n.fecha DESC;


SELECT
    p.codigo,
    p.nombre,
    a.tipo,
    a.titulo,
    a.descripcion,
    a.fecha
FROM public.actividades_prospectos a
JOIN public.prospectos p
    ON p.id = a.prospecto_id
ORDER BY a.fecha DESC;