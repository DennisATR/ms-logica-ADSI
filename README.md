# ms-logica-negocio - Sistema de Ventas e Inventario (ADSI)

Microservicio backend encargado de la lógica de negocio, persistencia y control operativo para la gestión integral de ventas, inventario y punto de venta (POS), especialmente adaptado para negocios de calzado y comercio minorista/mayorista.

---

## Problema que Resuelve

La gestión manual o descentralizada en negocios de comercio y zapaterías suele generar descontrol en stock de tallas/series, pérdidas por falta de arqueos de caja, errores en la facturación y dificultades para rastrear créditos o ganancias reales.

Este microservicio centraliza y automatiza toda la operativa comercial resolviendo:
- **Control de inventario por series y unidades:** Manejo de modelos, tallas, colores, mermas y etiquetado con códigos de barras.
- **Agilidad en Punto de Venta (POS):** Facturación rápida con integración directa a impresoras térmicas de tickets y cajón monedero.
- **Control de flujo de caja y cartera:** Arqueos de caja por método de pago, control de egresos/gastos y seguimiento de ventas a crédito.
- **Toma de decisiones con datos reales:** Métricas financieras y KPIs de ventas, productos más vendidos, márgenes de ganancia y rendimiento diario/mensual.

---

## Funcionalidades Principales

### 1. Gestión de Calzado e Inventario
- **Catálogo de productos:** Administración de modelos, marcas, colores, tallas, precios de costo, venta al por mayor y al detal.
- **Creación por series y curvas:** Registro masivo de calzado por numeración/tallas en un solo paso.
- **Control de stock y mermas:** Movimientos de almacén, seguimiento de existencias y registro de calzado dañado o defectuoso.
- **Impresión de etiquetas:** Generación de stickers con códigos TSPL para impresoras térmicas (ej. 3nStar) vía USB.

### 2. Facturación y Punto de Venta (POS)
- **Registro de ventas:** Emisión de facturas vinculadas a clientes y vendedores con cálculo automático de totales.
- **Impresión térmica (ESC/POS):** Generación de recibos para impresoras de 58mm y 80mm, soporte de caracteres en español (CP850) y apertura automática de cajón monedero.
- **Gestión post-venta:** Control de devoluciones, productos pendientes de entrega y despachos por transportadora.

### 3. Cierre de Caja, Gastos y Créditos
- **Cierres de caja diarios:** Arqueo con desglose por métodos de pago (efectivo, transferencias, etc.) e impresión de comprobante de cierre.
- **Control de egresos:** Registro y categorización de gastos operativos del negocio (servicios, arriendos, suministros) y costos de fletes/envíos.
- **Cartera y créditos:** Registro de compras a crédito, abonos sucesivos, saldos pendientes y estado de cuenta de proveedores.

### 4. Dashboard y Analítica
- **KPIs en tiempo real:** Ventas totales, ticket promedio, pares vendidos, ganancia bruta, egresos y ganancia neta.
- **Análisis temporal:** Línea de tiempo diaria (últimos 30 días) y balance mensual del año.
- **Top de productos:** Ranking de calzados más vendidos con filtros por categoría y rango de fechas.
- **Distribución de pagos:** Desglose porcentual por método de pago e indicadores de efectividad de recaudo de créditos.

### 5. Seguridad y Control de Acceso
- **Autenticación y roles (RBAC):** Manejo de permisos granulares por menú (guardar, editar, eliminar, listar, descargar) protegidos por JWT.
- **Integración RADIUS:** Aprovisionamiento automático de credenciales para acceso a redes locales/WiFi.
- **Notificaciones:** Integración vía Axios para alertas y eventos del sistema.

---

## Tecnologías Usadas

- **Entorno y Lenguaje:** [Node.js](https://nodejs.org/) (v18, v20 o v22) y [TypeScript](https://www.typescriptlang.org/) (~5.2).
- **Framework Backend:** [LoopBack 4](https://loopback.io/) (`@loopback/rest`, `@loopback/repository`, `@loopback/core`, `@loopback/authentication`).
- **Base de Datos:** [MySQL](https://www.mysql.com/) a través de `loopback-connector-mysql` y `mysql2`.
- **Seguridad y Criptografía:** JSON Web Tokens (`jsonwebtoken`, `parse-bearer-token`) y hashing con `crypto-js`.
- **Hardware e Impresión POS:**
  - Protocolo **ESC/POS** (`usb`, `escpos`, `escpos-usb`, `printer`) para tickets y apertura de gaveta de dinero.
  - Protocolo **TSPL** para impresión de stickers y códigos de barras en etiquetas adhesivas.
  - Generación de documentos con `pdfkit`, `pdf-to-printer` y `docx`.
- **Contenedores y Despliegue:** [Docker](https://www.docker.com/).

---

## Instalación y Configuración

1. **Clonar el repositorio e instalar dependencias:**
   ```sh
   npm install
   ```

2. **Configuración de variables de entorno:**
   Cree o configure el archivo `.env` en la raíz con las credenciales de base de datos y entorno:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_DATABASE=ms_logica_db
   ```

3. **Compilar el proyecto:**
   ```sh
   npm run build
   ```

---

## 🚦 Ejecución

- **Modo desarrollo:**
  ```sh
  npm start
  ```
- **Modo observador (watch):**
  ```sh
  npm run build:watch
  ```

El servicio estará disponible por defecto en: [http://127.0.0.1:3000](http://127.0.0.1:3000)
El explorador de OpenAPI / Swagger se encuentra en: [http://127.0.0.1:3000/explorer](http://127.0.0.1:3000/explorer)

---

## Otros Comandos Útiles

| Comando | Descripción |
|---|---|
| `npm run rebuild` | Limpia compilaciones anteriores y recompila el código TypeScript. |
| `npm run lint` / `npm run lint:fix` | Revisa y corrige errores de formato con ESLint y Prettier. |
| `npm test` | Ejecuta las pruebas unitarias e integrales con Mocha. |
| `npm run docker:build` | Construye la imagen Docker del microservicio. |
| `npm run docker:run` | Levanta el microservicio en un contenedor Docker. |
| `npm run openapi-spec` | Genera la especificación OpenAPI en un archivo. |
