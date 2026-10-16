# Política de Seguridad de Espiralia

En Espiralia priorizamos la privacidad y la protección de los datos de nuestros usuarios. Esta política describe nuestras versiones soportadas, el procedimiento para reportar vulnerabilidades y nuestros compromisos de divulgación responsable.

---

## Versiones Soportadas

Actualmente se entregan parches de seguridad para las siguientes versiones activas:

| Versión | Soportada | Notas |
| :--- | :--- | :--- |
| **0.3.x** | ✅ Sí | Versión activa en producción (`main`) |
| **0.2.x** | ❌ No | Deprecada; actualizar a 0.3.0 o superior |
| **< 0.2.0** | ❌ No | No soportada |

---

## Modelo de Amenazas y Arquitectura de Seguridad

Espiralia es una **Single Page Application (SPA) 100% estática en cliente**:
- **Cero backend remoto**: No existen servidores API propios, microservicios remotos ni bases de datos en la nube que gestionen datos de usuario.
- **Aislamiento local**: Los datos se almacenan exclusivamente en el navegador del usuario (`localStorage`) particionados de forma estricta por `profileId`.
- **Criptografía estándar**:
  - Hashing de PIN de perfiles con PBKDF2 (100.000 iteraciones SHA-256) y sal criptográfica aleatoria de 16 bytes mediante Web Crypto API.
  - Cifrado simétrico de exportación de Bóveda mediante AES-GCM de 256 bits y clave derivada con PBKDF2.
- **Protección contra fugas**: Cero telemetría externa, cero rastreadores y cero llamadas de red no autorizadas.

---

## Reportar una Vulnerabilidad

Si descubres una vulnerabilidad de seguridad en Espiralia, te pedimos que la reportes de forma privada y coordinada:

1. **Canal preferente — GitHub Private Vulnerability Reporting**:
   - Accede a la pestaña **Security** del repositorio: [Reportar Vulnerabilidad Privada](https://github.com/marceloriv/Espiralia/security/advisories/new).
   - Proporciona detalles técnicos reproducibles: pasos para reproducir, impacto estimado y prueba de concepto (PoC).
2. **Canal alternativo**:
   - Si el reporte privado de GitHub no está disponible, contacta directamente al mantenedor del proyecto vía su perfil de GitHub (@marceloriv).

**Por favor, NO abras issues públicos ni compartas la vulnerabilidad públicamente hasta que haya sido evaluada y corregida.**

---

## Tiempos de Respuesta (SLA)

- **Confirmación inicial**: En un plazo máximo de **48 horas** tras recibir el reporte.
- **Evaluación y triage**: Dentro de **3 a 5 días hábiles**, clasificando la severidad según CVSS v4.0.
- **Parche y divulgación coordinada**: Se acordará una ventana de publicación una vez liberada la versión con el fix (generalmente dentro de los 30 días posteriores).

---

## Alcance y Reglas de Compromiso

- No intentes acceder a datos de otros usuarios ni interrumpir la disponibilidad de servicios externos asociados (ej. GitHub Pages).
- Las pruebas de seguridad deben limitarse a entornos de desarrollo locales bajo tu control.
