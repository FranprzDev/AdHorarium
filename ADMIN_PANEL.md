# Panel de Administración de AdHorarium

El panel de administración permite gestionar completamente todos los recursos del sistema: usuarios y materias con sus correlativas.

## Acceso al Panel

- URL: `http://localhost:3000/admin`
- **Solo disponible para usuarios con rol `admin`**
- Los usuarios sin permisos serán redirigidos a la página principal

## Características

### 1. Gestión de Usuarios

**Ubicación:** `/admin/users`

Operaciones disponibles:
- **Listar usuarios**: Visualiza todos los usuarios del sistema
- **Crear usuario**: Agrega nuevos usuarios especificando:
  - Email
  - Nombre completo
  - Rol (usuario o administrador)
- **Editar usuario**: Cambia nombre y rol de usuarios existentes
- **Eliminar usuario**: Elimina usuarios del sistema
  - No puedes eliminar tu propia cuenta
  - No puedes dejar el sistema sin administrador

**Roles:**
- `user`: Acceso limitado al dashboard y gestión personal
- `admin`: Acceso completo al panel de administración

### 2. Gestión de Materias

**Ubicación:** `/admin/subjects`

Operaciones disponibles:
- **Listar materias**: Visualiza todas las materias del sistema
- **Crear materia**: Agrega nuevas materias especificando:
  - Nombre de la materia
  - Carrera asociada
- **Editar materia**: Cambia nombre o carrera de la materia
- **Eliminar materia**: Elimina la materia del sistema
- **Gestionar correlativas**: Define relaciones entre materias

### 3. Gestión de Correlativas

Las correlativas definen relaciones entre materias. Hay tres tipos:

1. **Debe estar aprobada** (`must_approve`)
   - El estudiante debe tener la otra materia **aprobada** para poder rendir esta

2. **Debe estar cursada** (`must_take`)
   - El estudiante debe tener la otra materia **cursada** para poder cursar esta

3. **Habilita** (`enables`)
   - Esta materia **habilita** para cursar otra

**Ejemplo:**
- Programación I debe tener Matemática I aprobada (`must_approve`)
- Programación II debe tener Programación I aprobada (`must_approve`)
- Algoritmos I habilitaría para Algoritmos II (`enables`)

**Cómo gestionar correlativas:**
1. Ve a `/admin/subjects`
2. Haz clic en el ícono de cadena (link) en la materia
3. Selecciona la materia correlativa y el tipo de relación
4. Haz clic en "Agregar"
5. Visualiza y elimina correlativas existentes

## Estructura de Base de Datos

### Tabla `users`
```sql
- id: UUID (clave primaria)
- email: TEXT (único)
- full_name: TEXT
- password_hash: TEXT (solo si es autenticación por email)
- avatar_url: TEXT
- provider: TEXT ('email' o 'manual')
- role: TEXT ('user' o 'admin')
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Tabla `subjects`
```sql
- id: SERIAL (clave primaria)
- name: TEXT
- career_id: INTEGER (referencia a careers)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Tabla `subject_correlatives`
```sql
- id: SERIAL (clave primaria)
- subject_id: INTEGER (referencia a subjects)
- correlative_id: INTEGER (referencia a subjects)
- correlation_type: TEXT ('must_approve', 'must_take', 'enables')
- created_at: TIMESTAMPTZ
```

## Seguridad

- ✅ Todas las rutas `/api/admin/*` verifican que el usuario sea administrador
- ✅ No se puede eliminar el último administrador del sistema
- ✅ No se puede eliminar la propia cuenta
- ✅ Las contraseñas se hashean con bcryptjs (salt rounds: 12)
- ✅ Las sesiones son seguras (HTTP-only cookies)

## Rutas API de Administración

### Usuarios

- `GET /api/admin/users` - Listar todos los usuarios
- `POST /api/admin/users` - Crear nuevo usuario
- `GET /api/admin/users/[id]` - Obtener detalles de un usuario
- `PATCH /api/admin/users/[id]` - Actualizar usuario
- `DELETE /api/admin/users/[id]` - Eliminar usuario

### Materias

- `GET /api/admin/subjects` - Listar todas las materias
- `POST /api/admin/subjects` - Crear nueva materia
- `GET /api/admin/subjects/[id]` - Obtener detalles de una materia
- `PATCH /api/admin/subjects/[id]` - Actualizar materia
- `DELETE /api/admin/subjects/[id]` - Eliminar materia

### Correlativas

- `GET /api/admin/subjects/correlatives` - Listar correlativas
- `POST /api/admin/subjects/correlatives` - Crear correlativa
- `DELETE /api/admin/subjects/correlatives?id=[id]` - Eliminar correlativa

## Componentes Frontend

### Sidebar (`AdminSidebar.tsx`)
- Navegación del panel
- Información del usuario actual
- Botón de logout

### Páginas
- `/admin` - Dashboard principal
- `/admin/users` - Gestión de usuarios
- `/admin/subjects` - Gestión de materias

### Modales
- `CreateUserModal.tsx` - Crear nuevo usuario
- `EditUserModal.tsx` - Editar usuario
- `CreateSubjectModal.tsx` - Crear nueva materia
- `EditSubjectModal.tsx` - Editar materia
- `CorrelativesModal.tsx` - Gestionar correlativas de una materia

### Tablas
- `UsersTable.tsx` - Tabla interactiva de usuarios
- `SubjectsTable.tsx` - Tabla interactiva de materias

## Próximos Pasos

Para expandir el panel podrías:
1. Agregar gestión de carreras
2. Implementar auditoría de cambios
3. Exportar datos a CSV/Excel
4. Agregar reportes de uso
5. Implementar búsqueda y filtros avanzados
