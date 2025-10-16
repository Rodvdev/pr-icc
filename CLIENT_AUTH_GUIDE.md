# Guía de Autenticación de Clientes

## 📋 Resumen de Cambios

Se ha implementado un sistema de autenticación separado para clientes, permitiendo que los clientes inicien sesión de forma independiente a los usuarios del sistema (administradores y agentes).

## ✨ Nuevas Características

### 1. **Doble Sistema de Autenticación**
- **Usuarios del Sistema** (Admin/Agent): Usan `/auth/signin`
- **Clientes**: Usan `/client/login`

### 2. **Proveedor de Autenticación para Clientes**
Se agregó un segundo proveedor de credenciales en NextAuth:
- `credentials`: Para usuarios del sistema (tabla `User`)
- `client-credentials`: Para clientes (tabla `Client`)

### 3. **Tipos Actualizados**
Se agregó el campo `userType` a las sesiones para distinguir entre:
- `USER`: Administradores y agentes
- `CLIENT`: Clientes del banco

### 4. **Protección de Rutas**
- El layout `/client` ahora verifica que el usuario sea un cliente
- Redirige automáticamente a `/client/login` si no hay sesión
- Redirige a `/auth/signin` si el usuario no es un cliente

## 🔐 Credenciales de Prueba

### Clientes
```
Email: sharon.aiquipa@utec.edu.pe
Password: client123

Email: carlos.izaguirre@utec.edu.pe
Password: client123

Email: rodrigo.vasquezdevel@utec.edu.pe
Password: client123
```

### Administradores
```
Email: admin@banking-agent.com
Password: admin123
```

### Agentes
```
Email: agent1@banking-agent.com
Password: admin123

Email: agent2@banking-agent.com
Password: admin123
```

## 🚀 Cómo Usar

### Para Clientes:
1. Visita `http://localhost:3000/client/login`
2. Ingresa tu email y contraseña
3. Serás redirigido a `/client` (dashboard de cliente)

### Para Administradores/Agentes:
1. Visita `http://localhost:3000/auth/signin`
2. Ingresa tu email y contraseña
3. Serás redirigido a `/admin` o `/agent` según tu rol

### Para Registrarse como Nuevo Cliente:
1. Visita `http://localhost:3000/register`
2. Completa el proceso de registro en 4 pasos
3. Tu registro quedará pendiente de aprobación
4. Una vez aprobado, podrás iniciar sesión en `/client/login`

## 📁 Archivos Modificados

### Nuevos Archivos:
- `src/app/client/login/page.tsx` - Página de login para clientes
- `CLIENT_AUTH_GUIDE.md` - Esta guía

### Archivos Actualizados:
- `src/lib/auth.ts` - Agregado proveedor de autenticación para clientes
- `src/types/next-auth.d.ts` - Agregado campo `userType` 
- `src/app/client/layout.tsx` - Actualizada protección de rutas
- `src/app/auth/signin/page.tsx` - Actualizado enlace a login de clientes
- `src/app/register/page.tsx` - Actualizada redirección post-registro

## 🔄 Flujo de Autenticación

### Clientes:
```
/client/login → NextAuth (client-credentials) → prisma.client.findUnique() 
→ bcrypt.compare() → session con userType="CLIENT" → /client
```

### Usuarios del Sistema:
```
/auth/signin → NextAuth (credentials) → prisma.user.findUnique() 
→ bcrypt.compare() → session con userType="USER" → /admin o /agent
```

## 🛡️ Seguridad

- Ambos sistemas usan bcrypt para hash de contraseñas (12 rounds)
- Las sesiones usan JWT con expiración de 30 días
- Los tokens se actualizan cada 24 horas
- Las cookies son httpOnly y secure en producción
- Verificación de estado activo (`status: ACTIVE` para clientes, `isActive: true` para usuarios)

## 🧪 Testing

Para probar la autenticación de clientes:

```bash
# 1. Asegúrate de que la base de datos esté poblada
npm run db:seed

# 2. Inicia el servidor de desarrollo
npm run dev

# 3. Visita http://localhost:3000/client/login

# 4. Usa las credenciales de prueba:
# Email: sharon.aiquipa@utec.edu.pe
# Password: client123
```

## ⚠️ Notas Importantes

1. **Separación de Tablas**: Los clientes están en la tabla `Client`, no en `User`
2. **Campos de Contraseña**: 
   - Usuarios: `password` 
   - Clientes: `hashedPassword`
3. **Estado Activo**:
   - Usuarios: `isActive` (boolean)
   - Clientes: `status` (enum: ACTIVE/BLOCKED/PENDING)
4. **Roles**: Los clientes automáticamente reciben el rol "CLIENT" en la sesión

## 🐛 Solución de Problemas

### Error: "Credenciales inválidas"
- Verifica que el email exista en la tabla `Client`
- Verifica que el estado del cliente sea `ACTIVE`
- Verifica que la contraseña sea correcta (default: `client123`)

### Error: "No se puede acceder a /client"
- Asegúrate de estar autenticado como cliente
- Verifica que `userType === "CLIENT"` en tu sesión
- Intenta cerrar sesión y volver a iniciar

### Error: Redirigido a login continuamente
- Verifica que las cookies no estén bloqueadas
- Revisa la consola del navegador para errores de NextAuth
- Verifica que `NEXTAUTH_SECRET` esté configurado en `.env`

## 📚 Referencias

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)

---

**Última actualización**: Octubre 16, 2025

