# SIMTELE-WEB — Panel educativo de prevención y monitoreo

**Proyecto de Programación Web I**  
Aplicación de una sola página (SPA sencilla) para practicar HTML, CSS y JavaScript mediante un escenario hipotético de monitoreo de un sistema de transporte por cable.

> **Aviso importante:** SIMTELE-WEB es un prototipo académico independiente. No pertenece a Mi Teleférico, no se conecta con sus sistemas, no recibe telemetría real y no controla equipos. Las líneas, estados, componentes, lecturas, alertas y umbrales son ejemplos ficticios.

## 1. Integrantes

- Integrante 1: Casablanca Condori Luis Boris
- Integrante 2: ______________________________
- Integrante 3: ______________________________
- Integrante 4: ______________________________

## 2. Archivos del proyecto

```text
SIMTELE-WEB/
├── index.html    # Estructura, formularios y secciones
├── styles.css    # Diseño visual y adaptación a celulares
├── script.js     # Validaciones, cálculos, arreglos, DOM y eventos
└── README.md     # Documentación e instrucciones
```

## 3. Cómo ejecutar en Visual Studio Code

1. Descarga y extrae la carpeta `SIMTELE-WEB`.
2. Abre Visual Studio Code.
3. Selecciona **Archivo → Abrir carpeta** y elige `SIMTELE-WEB`.
4. Abre `index.html`.
5. Puedes abrirlo directamente en el navegador o instalar la extensión **Live Server** y seleccionar **Open with Live Server**.
6. No se necesita Node.js, servidor backend, base de datos ni instalación de paquetes.

### Credenciales de demostración

- **Usuario:** `operador`
- **Contraseña:** `teleferico123`

Estas credenciales son fijas y públicas para la práctica. El formulario de acceso solo representa una pantalla de inicio de sesión. La validación está en JavaScript del navegador, por lo que **no es autenticación segura para un sistema real**.

## 4. Módulos incluidos

### Panel general

- Resumen de alertas pendientes, componentes, sensores y eventos.
- Estado ficticio de cuatro líneas de ejemplo.
- Accesos rápidos a los módulos.
- Últimas alertas y actividad reciente.
- Reloj y fecha del equipo.

### 1. Detención de emergencia

Recibe velocidad y tiempo de reacción, valida los rangos y calcula la distancia recorrida durante la reacción:

```text
d = (velocidad / 3.6) * tiempo
```

Umbrales exclusivamente didácticos:

- Menor a 20 m: referencia baja.
- De 20 a 50 m: precaución.
- Mayor a 50 m: alerta alta.

El cálculo **no** representa la distancia de frenado ni un procedimiento real de emergencia.

### 2. Mantenimiento

- Agrega nombre de componente, código interno opcional, horas de uso, estado y observaciones.
- Muestra los registros en una tabla dinámica.
- Permite eliminar registros con confirmación.
- Los estados disponibles son normal, revisión y urgente.
- Los estados revisión y urgente generan avisos en el centro de alertas.

### 3. Viento y oscilación

- Solicita cinco mediciones numéricas entre 0 y 150 km/h.
- Calcula promedio y máximo mediante ciclos.
- Muestra una clasificación descriptiva usando el promedio.
- Dibuja una visualización sencilla de las cinco lecturas.
- Guarda un historial de los últimos 30 análisis.

Clasificación didáctica del promedio:

- Menor a 20 km/h: bajo.
- De 20 a menos de 40 km/h: moderado.
- De 40 a menos de 60 km/h: elevado.
- 60 km/h o más: muy elevado.

### 4. Sensores

- Recibe código, tipo de sensor y lectura numérica.
- Valida el código con la expresión regular `/^SEN-\d{3}$/`.
- Rechaza campos vacíos, códigos incorrectos y códigos duplicados.
- Muestra los sensores válidos en una tabla dinámica.
- Permite eliminar sensores registrados.

Ejemplos:

- `SEN-001`: válido.
- `SEN-1`: inválido.
- Campo vacío: inválido.

### Centro de alertas

- Recibe alertas generadas por los módulos.
- Separa alertas altas y advertencias.
- Permite filtrar todas, pendientes o atendidas.
- Permite marcar una alerta como atendida.

### Bitácora de actividad

- Registra accesos, altas, eliminaciones, análisis y atención de alertas.
- Muestra fecha, operador, módulo, detalle y tipo de evento.
- Permite exportar los eventos a un archivo CSV.
- Permite limpiar la bitácora con confirmación.

## 5. Pruebas mínimas del desafío

| Módulo | Datos | Resultado esperado |
|---|---|---|
| Detención | 72 km/h y 3 s | 60,00 m y alerta alta según el umbral ficticio |
| Mantenimiento | Agregar dos componentes y eliminar uno | Queda una fila |
| Viento | 10, 20, 30, 40, 50 | Promedio 30 y máximo 50 km/h |
| Sensor | `SEN-001`, tipo Temperatura, lectura 24.5 | Registro válido |
| Sensor | `SEN-1` | Error de formato |
| Sensor | Código vacío | Error de campo obligatorio |

Para comprobar el promedio y máximo de viento, escribe exactamente `10`, `20`, `30`, `40` y `50` en los cinco campos.

## 6. Requisitos técnicos demostrados

- HTML semántico: `header`, `nav`, `main`, `section`, `footer`, formularios y etiquetas `label`.
- CSS propio con tarjetas, tablas, botones, estados y media queries para pantallas pequeñas.
- JavaScript externo, separado en `script.js`.
- Funciones propias y eventos `addEventListener`.
- Actualización del DOM sin recargar la página.
- Arreglos de objetos y métodos `push`, `filter` y `forEach`.
- Ciclos `for`, condicionales `if/else` y `parseFloat`.
- Expresión regular para validar códigos de sensores.
- Validación de campos vacíos, valores no numéricos y rangos.
- `localStorage` para conservar componentes, sensores, alertas, bitácora e historial de viento en el mismo navegador.
- `sessionStorage` para conservar el acceso mientras la pestaña siga abierta.

## 7. Publicar mediante GitHub Pages

1. Crea una cuenta o inicia sesión en GitHub.
2. Crea un repositorio nuevo, por ejemplo `simtele-web`.
3. Sube `index.html`, `styles.css`, `script.js` y `README.md` a la raíz del repositorio.
4. Abre **Settings → Pages**.
5. En **Build and deployment**, selecciona **Deploy from a branch**.
6. Elige la rama `main` y la carpeta `/ (root)`, y guarda.
7. Espera a que GitHub Pages termine la publicación y copia la URL pública que aparezca en esa sección.
8. Entrega tanto la URL pública como la URL del repositorio.

## 8. Alcance y limitaciones

- Los datos se guardan en el almacenamiento local del navegador; no se comparten entre computadoras ni usuarios.
- El inicio de sesión es solo demostrativo: no hay servidor, cifrado de credenciales, roles reales ni control de acceso seguro.
- El estado de líneas es ilustrativo y no cambia según sensores reales.
- Las clasificaciones y umbrales son inventados para fines didácticos; no deben utilizarse para tomar decisiones de operación, mantenimiento o seguridad.
- Para convertirlo en un sistema real se necesitarían, entre otros elementos, backend, autenticación segura, base de datos, permisos, auditoría y validación por especialistas.
