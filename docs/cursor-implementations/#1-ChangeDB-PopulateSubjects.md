# Documentación: Poblado y Mantenimiento de la Base de Datos

Este documento detalla el proceso de poblado inicial, asignación de mesas de examen y mantenimiento de la tabla `subjects` en la base de datos.

## 1. Poblado Inicial de Materias

El primer paso consistió en poblar la tabla `subjects` con las materias de cinco carreras de ingeniería distintas. Para manejar las materias comunes entre varias carreras, se adoptó la siguiente lógica:

1.  **Estandarización:** Todos los nombres de las materias se convirtieron a mayúsculas para mantener la consistencia.
2.  **Creación de "Ciencias Básicas":** Se creó una nueva carrera llamada "Ciencias Básicas" (con `id=6`) para agrupar todas las materias que son compartidas por más de una ingeniería.
3.  **Poblado:** Las materias se insertaron en la base de datos, asignando las materias únicas a su respectiva carrera y las materias comunes a "Ciencias Básicas".

### Creación de la carrera "Ciencias Básicas"
```sql
INSERT INTO public.careers (id, name, code) VALUES (6, 'Ciencias Básicas', 'CB') 
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;
```

### Inserción final de materias
```sql
INSERT INTO public.subjects (name, career_id) VALUES 
('LÓGICA Y ESTRUCTURAS DISCRETAS', 1),
('ALGORITMOS Y ESTRUCTURAS DE DATOS', 1),
-- ... (se omite el resto de las ~140 materias por brevedad) ...
('TERMODINÁMICA', 6),
('ORGANIZACIÓN INDUSTRIAL', 6);
```

## 2. Asignación de Mesas de Examen

Una vez poblada la tabla, el siguiente paso fue asignar a cada materia su `exam_table_id` correspondiente, basándonos en listas proporcionadas para cada carrera.

### Creación de las Mesas de Examen
Primero, nos aseguramos de que las mesas existieran en la tabla `exam_tables`.

```sql
INSERT INTO public.exam_tables (id, name) VALUES (1, 'Mesa 1'), (2, 'Mesa 2'), (3, 'Mesa 3')
ON CONFLICT (id) DO NOTHING;
```

### Actualización por Carrera

Se realizaron varias consultas `UPDATE` para asignar el `exam_table_id` a las materias. El proceso implicó identificar materias con nombres ambiguos y resolverlos.

#### Ingeniería en Sistemas de Información
```sql
-- Actualizaciones iniciales
UPDATE public.subjects SET exam_table_id = 1 WHERE UPPER(name) = 'ANÁLISIS MATEMÁTICO I';
-- ...

-- Actualizaciones tras resolver ambigüedades
UPDATE public.subjects SET exam_table_id = 1 WHERE UPPER(name) = 'ALGORITMOS Y ESTRUCTURAS DE DATOS';
UPDATE public.subjects SET exam_table_id = 2 WHERE UPPER(name) = 'SISTEMAS Y PROCESOS DE NEGOCIO';
-- ...
```

#### Ingeniería Civil
```sql
-- Actualizaciones iniciales
UPDATE public.subjects SET exam_table_id = 1 WHERE UPPER(name) = 'INGENIERÍA CIVIL II';
-- ...

-- Actualizaciones tras resolver ambigüedades
UPDATE public.subjects SET exam_table_id = 1 WHERE UPPER(name) = 'DISEÑO ARQ. PLANEAMIENTO Y URBANISMO I';
UPDATE public.subjects SET exam_table_id = 3 WHERE UPPER(name) = 'ORGANIZACIÓN Y CONDUCCIÓN DE OBRAS';
-- ...
```

#### Ingeniería Mecánica, Eléctrica y Electrónica
Se ejecutó una consulta combinada para las tres carreras restantes.

```sql
-- Mesa 1 Updates
UPDATE public.subjects SET exam_table_id = 1 WHERE UPPER(name) IN ('ANÁLISIS MATEMÁTICO I', 'ECONOMÍA', 'FÍSICA I', ...);

-- Mesa 2 Updates
UPDATE public.subjects SET exam_table_id = 2 WHERE UPPER(name) IN ('FÍSICA II', 'SISTEMAS DE REPRESENTACIÓN', ...);

-- Mesa 3 Updates
UPDATE public.subjects SET exam_table_id = 3 WHERE UPPER(name) IN ('INGENIERÍA Y SOCIEDAD', 'ANÁLISIS MATEMÁTICO II', ...);
```

## 3. Limpieza y Verificación Final

### Eliminación de Materias Duplicadas
Se identificó que `Inglés Técnico II` era una materia redundante y se eliminó para mantener solo `INGLÉS I` e `INGLÉS II`.

```sql
DELETE FROM public.subjects WHERE UPPER(name) = 'INGLÉS TÉCNICO II';
```

### Verificación del Estado Final
Finalmente, se ejecutó una consulta para verificar si quedaban materias sin carrera asignada (ninguna) o sin mesa de examen.

```sql
SELECT s.name as subject_name, c.name as career_name, s.career_id
FROM public.subjects s
LEFT JOIN public.careers c ON s.career_id = c.id
WHERE s.career_id IS NULL OR s.exam_table_id IS NULL
ORDER BY c.name, s.name;
```

El resultado de esta consulta arrojó la lista final de materias que aún requieren la asignación de una mesa de examen.
