# Sistema de Autenticación - AdHorarium

## Descripción

El sistema de autenticación de AdHorarium implementa:
- ✅ Login/Registro con email y contraseña
- ✅ Sistema de roles (user, admin)
- ✅ Sesiones seguras con HTTP-only cookies
- ✅ Hashing de contraseñas con bcryptjs
- ✅ Base de datos Neon PostgreSQL

## Configuración Inicial

### 1. Configurar variables de entorno

Debes tener `DATABASE_URL` configurada en Neon. Para conectarla en v0:
1. En el sidebar derecho, clickea **Settings** (ícono de engranaje)
2. Ve a **Integrations** y conecta **Neon**
3. La variable `DATABASE_URL` se agregará automáticamente

### 2. Crear usuario administrador

```bash
# Con contraseña por defecto (cambiala después):
pnpm ts-node scripts/create-admin.ts

# Con contraseña personalizada:
ADMIN_PASSWORD="TuContraseña123" pnpm ts-node scripts/create-admin.ts
```

El script creará un admin con:
- Email: `admin@adhorarium.com`
- Contraseña: La que especifiques o por defecto `Admin123456`
- Rol: `admin` (con permisos completos)

## Estructura de datos

### Tabla: users
```sql
id (UUID PRIMARY KEY)
email (TEXT NOT NULL UNIQUE)
password_hash (TEXT)
full_name (TEXT)
avatar_url (TEXT)
provider (TEXT) -- "email"
role (TEXT) -- "user" | "admin"
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

### Tabla: sessions
```sql
id (UUID PRIMARY KEY)
user_id (UUID FOREIGN KEY)
expires_at (TIMESTAMPTZ)
created_at (TIMESTAMPTZ)
```

## API de Autenticación

### POST /api/auth/login
Inicia sesión con email y contraseña.

**Request:**
```json
{
  "email": "usuario@email.com",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "full_name": "Nombre Usuario",
    "avatar_url": null,
    "provider": "email",
    "role": "user"
  }
}
```

**Response (401):**
```json
{
  "error": "Email o contraseña incorrectos"
}
```

### POST /api/auth/register
Registra un nuevo usuario (siempre como "user", no admin).

**Request:**
```json
{
  "email": "nuevo@email.com",
  "password": "contraseña123",
  "full_name": "Nombre Completo"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "nuevo@email.com",
    "full_name": "Nombre Completo",
    "avatar_url": null,
    "provider": "email",
    "role": "user"
  }
}
```

### GET /api/auth/me
Obtiene datos del usuario actual (requiere sesión válida).

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "full_name": "Nombre Usuario",
    "avatar_url": null,
    "provider": "email",
    "role": "user"
  }
}
```

**Response (401):**
```json
{
  "user": null
}
```

### POST /api/auth/logout
Cierra la sesión actual.

**Response (200):**
```json
{
  "success": true
}
```

## Uso en componentes

### Verificar autenticación
```tsx
import { useAuthStore } from '@/stores/useAuthStore'

function MyComponent() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <div>Cargando...</div>
  if (!user) return <div>No autenticado</div>

  return <div>Bienvenido, {user.full_name}</div>
}
```

### Verificar si es admin
```tsx
const { user } = useAuthStore()
const isAdmin = user?.role === 'admin'

if (isAdmin) {
  // Mostrar opciones de administrador
}
```

### Login
```tsx
import { useAuthStore } from '@/stores/useAuthStore'

async function handleLogin(email: string, password: string) {
  await useAuthStore.getState().signInWithPassword(email, password)
}
```

### Logout
```tsx
async function handleLogout() {
  await useAuthStore.getState().signOut()
}
```

## Detalles técnicos

### Seguridad de sesiones
- Las sesiones se almacenan en HTTP-only cookies
- Las cookies son `Secure` en producción (`NODE_ENV === 'production'`)
- Son `SameSite: Lax` para proteger contra CSRF
- Expiran después de 30 días (`SESSION_DURATION_DAYS`)

### Hashing de contraseñas
- Utiliza bcryptjs con salt rounds = 12
- Las contraseñas se hashean antes de guardarse en la BD
- Solo se pueden validar con `bcrypt.compare()`

### Flujo de autenticación
1. Usuario envía email + contraseña a `/api/auth/login` o `/api/auth/register`
2. Se valida email/contraseña con bcrypt
3. Se crea una sesión en la BD con una UUID única
4. Se devuelve una cookie con el sessionId (HTTP-only)
5. En futuras requests, la middleware `lib/auth.ts` valida la cookie
6. La sesión debe estar vigente (no expirada) para ser válida

## Proteger rutas

Para proteger una ruta API que requiera autenticación:

```tsx
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Aquí session.user contiene los datos del usuario autenticado
  // Incluyendo su role para verificar permisos
  
  const isAdmin = session.user.role === 'admin'
}
```

## Próximos pasos (recomendaciones)

1. **Crear panel de admin**: Para que los administradores puedan gestionar usuarios y recursos
2. **Middleware de permisos**: Verificar role en rutas protegidas
3. **Cambio de contraseña**: Endpoint para que usuarios cambien su contraseña
4. **2FA (opcional)**: Autenticación de dos factores para cuentas de admin
5. **Auditoría**: Registrar cambios realizados por administradores
