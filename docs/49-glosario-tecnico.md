# 49 — GLOSARIO TÉCNICO Y DE NEGOCIO GASTRONÓMICO
## Diccionario Terminológico de Arquitectura SaaS y Operación de Food Trucks

---

* **Tenant (Inquilino / Carrito):** Cada uno de los negocios gastronómicos independientes que operan dentro de la plataforma con su propio catálogo, colores y configuraciones.
* **RLS (Row Level Security):** Mecanismo del motor PostgreSQL que filtra a nivel de fila las consultas para impedir que un carrito acceda a datos ajenos.
* **KDS (Kitchen Display System):** Pantalla digital de comandas diseñada para agilizar el despacho de pedidos en la plancha y cocina.
* **ETA (Estimated Time of Arrival / Preparation):** Tiempo estimado de elaboración que se le comunica al comensal antes y después de comprar.
* **GMV (Gross Merchandise Value):** Valor total de todas las transacciones de comida procesadas por los carritos en la plataforma.
* **MRR (Monthly Recurring Revenue):** Ingreso mensual recurrente generado por el cobro de suscripciones a los planes del software.
* **Checkout Pro:** Modalidad de cobro de Mercado Pago que permite pagar mediante tarjetas, transferencias o saldo en cuenta con redirección segura.
* **Web Audio API:** API nativa del navegador para sintetizar señales sonoras mediante código matemático sin descargar archivos MP3 de audio.
* **Idempotencia:** Propiedad de un servicio (como el webhook de pagos) que garantiza que múltiples envíos de la misma notificación produzcan el mismo resultado sin duplicar cobros ni pedidos.
* **Options Snapshot:** Instantánea inmutable en JSONB de los ingredientes y extras elegidos por el cliente en el instante exacto de la compra.
