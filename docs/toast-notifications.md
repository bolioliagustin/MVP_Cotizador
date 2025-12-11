# Sistema de Notificaciones Toast

Este proyecto usa un sistema de notificaciones toast moderno y personalizado en lugar de los `alert()` por defecto del navegador.

## Uso Básico

```javascript
import { toast } from "./lib/toast.js";

// Notificación de éxito (verde)
toast.success("¡Operación completada!");

// Notificación de error (rojo)
toast.error("Hubo un error al procesar");

// Notificación de advertencia (amarillo)
toast.warning("Por favor verifica los datos");

// Notificación informativa (azul)
toast.info("Información importante");
```

## Características

### Tipos de Notificaciones

- **Success** (`toast.success`): Color verde, para operaciones exitosas
- **Error** (`toast.error`): Color rojo, para errores
- **Warning** (`toast.warning`): Color amarillo, para advertencias
- **Info** (`toast.info`): Color azul, para información general

### Personalización

Todas las notificaciones aceptan un segundo parámetro opcional para la duración (en milisegundos):

```javascript
toast.success("Mensaje corto", 2000); // Se cierra después de 2 segundos
toast.error("Mensaje largo", 6000); // Se cierra después de 6 segundos
```

### Notificación de Carga

Para operaciones que toman tiempo, usa `toast.loading()`:

```javascript
const dismiss = toast.loading("Procesando...");

// Cuando termina la operación, cierra la notificación
try {
  await someAsyncOperation();
  dismiss(); // Cierra el toast de carga
  toast.success("¡Completado!");
} catch (error) {
  dismiss(); // Cierra el toast de carga
  toast.error("Error: " + error.message);
}
```

## Estilos

Las notificaciones incluyen:
- ✨ Animaciones suaves de entrada/salida
- 🎨 Gradientes modernos para cada tipo
- 🌙 Soporte para modo oscuro automático
- 📱 Diseño responsive para móviles
- ✕ Botón de cierre manual
- ⏱️ Auto-cierre después de 4 segundos (configurable)

## Ubicación

Las notificaciones aparecen en la esquina superior derecha de la pantalla y se apilan verticalmente si hay múltiples.

En dispositivos móviles, se ajustan automáticamente al ancho de la pantalla.
