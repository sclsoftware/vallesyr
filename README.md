# Control Horario
## Personalización para Vallesyr (Linux 64 bits)

## Instalación

```bash
# crear el directorio donde se va a instalar, por ejemplo:
sudo mkdir -p /var/www/vallesyr
cd /var/www/vallesyr

# clonar el repo
git clone git@github.com:sclsoftware/vallesyr.git

# Generar la base de datos y config.
# Se puede ejecutar todas las veces que se quiera,
# si ya esta creada no hace nada.
./am appinit.bin customfields,vallesyr

# Arrancar el programa
./am appserver.bin
```

Abrir un navegador moderno http://localhost:1259

Las instrucciones generales del programa están en https://sclsoftware.com/blog/attendance.html

## Sincronización automática

Para que funcione la sincronización hay que establecer en el programa
en el menu de arriba a la derecha, en la ruedecita de opciones, configuración general -> avanzada: 

 - No sincronizar huellas: **si** (hace que sincronice mucho más rápido)
 - Hora inicio sincronización
 - Hora fin sincronización
 - Terminal maestro (seleccionar el terminal desde el que se tienen que sincronizar los usuarios en el resto de terminales)

## Monitorizar el programa

El programa genera dos tipos de logs en **www/logs**:

 - "system" donde guarda errores o los eventos de sincronización por ejemplo
 - "access" con las peticiones que recibe el servidor

Para comprobar en tiempo real la sincronización:

```bash
/www/logs/2019-11-15$ tail -f system.log 
2019-11-15 12:16:57 Jobs started
2019-11-15 12:16:57 Server initialized
2019-11-15 12:16:57 sincronizando...
2019-11-15 12:16:57 No hay hora de inicio de sincronización. No sincronizar nada.
```


