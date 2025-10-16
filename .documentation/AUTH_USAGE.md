# Guía de Uso del Sistema de Autenticación

## Contexto de Autenticación Mejorado

El sistema ahora mantiene la sesión persistente al actualizar las páginas utilizando NextAuth con JWT y un contexto global de autenticación.

## Mejoras Implementadas

### 1. Configuración de Sesión Persistente

La configuración en `src/lib/auth.ts` ahora incluye:

- **Estrategia JWT**: Las sesiones se almacenan como tokens JWT en cookies
- **Duración de sesión**: 30 días de validez
- **Cookies seguras**: Configuradas con httpOnly y sameSite para seguridad
- **Callbacks optimizados**: Manejo eficiente de tokens y sesiones

### 2. AuthProvider Mejorado

El componente `AuthProvider` ahora:

- Recibe la sesión inicial del servidor (SSR)
- Refresca la sesión automáticamente cada 5 minutos
- Refresca la sesión cuando la ventana recupera el foco
- Evita el flash de contenido no autenticado

### 3. Hook Personalizado `useAuth`

Un hook conveniente para usar en componentes cliente.

## Cómo Usar

### En Componentes Cliente

```tsx
"use client"

import { useAuth } from "@/hooks/use-auth"

export default function MiComponente() {
  const { user, isAuthenticated, isLoading, session } = useAuth()

  if (isLoading) {
    return <div>Cargando...</div>
  }

  if (!isAuthenticated) {
    return <div>No autenticado</div>
  }

  return (
    <div>
      <h1>Hola, {user?.name}!</h1>
      <p>Role: {user?.role}</p>
    </div>
  )
}
```

### Con Redirección Automática

```tsx
"use client"

import { useAuth } from "@/hooks/use-auth"

export default function PaginaProtegida() {
  // Redirige automáticamente a /auth/signin si no está autenticado
  const { user } = useAuth(true)

  return (
    <div>
      <h1>Contenido protegido para {user?.name}</h1>
    </div>
  )
}
```

### En Componentes de Servidor

```tsx
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function PaginaServidor() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div>
      <h1>Hola, {session.user.name}!</h1>
    </div>
  )
}
```

### Usando el Hook de NextAuth Directamente

```tsx
"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <button disabled>Cargando...</button>
  }

  if (session) {
    return (
      <div>
        <p>Conectado como {session.user.email}</p>
        <button onClick={() => signOut()}>Cerrar Sesión</button>
      </div>
    )
  }

  return <button onClick={() => signIn()}>Iniciar Sesión</button>
}
```

## Acceso a Datos de la Sesión

### Información Disponible

```typescript
session.user = {
  id: string,        // ID del usuario
  name: string,      // Nombre del usuario
  email: string,     // Email del usuario
  role: string,      // Rol del usuario (SUPER_ADMIN, ADMIN, etc.)
  image?: string     // URL de la imagen de perfil (opcional)
}
```

## Protección de Rutas

### Usando el componente RoleGate

```tsx
import { RoleGate } from "@/components/auth/role-gate"

export default function PaginaAdmin() {
  return (
    <RoleGate allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <div>Contenido solo para administradores</div>
    </RoleGate>
  )
}
```

## Variables de Entorno Necesarias

Asegúrate de tener estas variables en tu `.env`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secreto_super_seguro_aqui
DATABASE_URL="postgresql://..."
```

## Comportamiento de la Sesión

1. **Al iniciar sesión**: El token JWT se guarda en una cookie httpOnly
2. **Al navegar**: La sesión persiste en todas las páginas gracias al AuthProvider
3. **Al refrescar**: La sesión se recupera del servidor en el layout
4. **Al cerrar ventana**: La sesión persiste gracias a la cookie
5. **Después de 30 días**: La sesión expira y se requiere nuevo login
6. **Cada 5 minutos**: La sesión se refresca automáticamente
7. **Al cambiar de pestaña**: La sesión se refresca al regresar

## Solución de Problemas

### La sesión se pierde al refrescar

- Verifica que el `AuthProvider` esté en el `layout.tsx` raíz
- Asegúrate de que `NEXTAUTH_SECRET` esté configurado
- Revisa que las cookies no estén siendo bloqueadas

### Error de tipos con TypeScript

- Los tipos están extendidos en `src/types/next-auth.d.ts`
- Asegúrate de que el archivo esté incluido en tu `tsconfig.json`

### La sesión no se actualiza

- El hook `useAuth` refresca automáticamente cada 5 minutos
- Puedes forzar una actualización con `update()` de `useSession()`

