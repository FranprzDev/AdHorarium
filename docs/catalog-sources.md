# Catalog sources: Ingeniería en Sistemas de Información (UTN-FRT)

The ISI catalog is seeded from official documents of the Departamento de Ingeniería en Sistemas de Información
(UTN-FRT). Every subject and correlative in `db/seed/catalog/*.ts` names the document it was read from
(`CatalogSource` in `db/seed/catalog/sources.ts`). Documents were read on 2026-10-16.

| Source | Used for |
|---|---|
| [Plan de correlativas · Anexo de modificación Res. 775/2008 · Plan 2008](https://sistemasfrtutn.ar/wp-content/uploads/2024/10/correlativa-ISI-PAN-2008-775-2008.pdf) (plan actualizado al año 2017) | Plan 2008 subjects 1–35: name, level, weekly hours, correlatives to take (regulares / aprobadas) and to sit (aprobadas) |
| [Diseño Curricular](https://sistemasfrtutn.ar/institucional/diseno-curricular/) (tables "Correlativas Plan 2008/2023 - Obligatorias/Electivas") | Habilitación Profesional (plan 2008), Seminario Integrador (plan 2023), weekly hours of the electives; cross-check of the plan 2008 table (34 of 34 subjects identical) |
| [Sistema de Correlatividades de las Materias Electivas 2026](https://docs.google.com/spreadsheets/d/1U4pMR5_Xk6t8eRCF4N5rDNxevz5vuVyN/edit?gid=1280240086) (planes 2008 y 2023, [post](https://sistemasfrtutn.ar/elegi-la-electiva-que-te-interesa-y-verifica-que-materias-necesitas-para-poder-cursarla/)) | The 28 electives of each plan, their level and their correlatives to take and to sit (per-year sheets) |
| [Ord. 1939 · Régimen de correlatividades Analista Desarrollador plan 2023](https://sistemasfrtutn.ar/wp-content/uploads/2024/10/1939-2023-Regimen-de-correlativas-de-Analista-Desarrollador-2023.pdf) | Confirms the Seminario Integrador requirements (cursada 16, aprobadas 6-8-13-14 in that plan's numbering) |
| [Ord. 1877 · Diseño curricular ISI 2023](https://sistemasfrtutn.ar/wp-content/uploads/2024/10/1877-2022-Diseno-Curricular-ISI-2023.pdf) | Elective hours each level requires (3.º: 4 h, 4.º: 6 h, 5.º: 10 h weekly, annual) |

## Model

- Plan 2008 is its own career: code `ISI-2008`, same name as `ISI`, plan `2008`. The SysAcad importer finds it by name
  and plan ("Cambiar a … (Plan 2008)"). Selectors show the newest plan with its plain name and older plans as
  "Ingeniería en Sistemas de Información (Plan 2008)".
- Electives are subjects with `is_elective = true`, shown with an "Electiva" badge. They are never basic sciences.
- Numbers: plan 2008 keeps the document codes 1–35; Habilitación Profesional is 36 and the electives 37–64. Plan 2023
  keeps Ord. 1877's 1–36; Seminario Integrador is 37 and the electives 38–65. Numbers above the official ones are
  AdHorarium's own (the documents do not number them).
- "Todas las materias del 1.er nivel" and "todas las materias del 2.º nivel excepto Física II" are stored as the
  subjects of that level of the same plan.
- Sheet names written with the other plan's subject names are read within the plan of the sheet: for example
  "Análisis de Sistemas" in a plan 2023 sheet is Análisis de Sistemas de Información, and "Diseño de Sistemas de
  Información" in a plan 2008 sheet is Diseño de Sistemas.

## Left out on purpose

- Habilitación Profesional (plan 2008): the web table also lists "Redes de Datos" as a regular requirement, a plan
  2023 subject with no plan 2008 equivalent named; it is not stored.
- Proyecto Final (plan 2008) "para rendir: todas", and Seminario Integrador / Proyecto Final (plan 2023) "aprobar todas
  las asignaturas previas": not expanded into correlatives.
- Agilidad y Gestión de Productos Digitales and Testing Automatizado de Software (plan 2023): the alternative
  requirement for students who changed plan without taking Diseño de Sistemas de Información is not modelled.
- Gestión de Procesos de Negocio: no hours published.
- Seminario Integrador and Habilitación Profesional: no weekly hours in the documents above.
- Plan 2008 electives of earlier years (Res. 159/2014, 1149/2014, 1170/2017) that are not in the 2026 elective list
  (e.g. Redes Avanzadas, Implementación de Bases de Datos): not seeded.
- The number of elective hours each level requires is documented here but not modelled.
