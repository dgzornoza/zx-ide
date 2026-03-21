# historia de usuario para extraer un mapa con tiles

## Descripción

Como usuario, quiero poder extraer un mapa con tiles desde Tiled, para poder utilizarlo en mi aplicación de manera eficiente y personalizada.

## Ejemplo de archivo de mapa en Tiled

El siguiente es un ejemplo de un archivo de mapa en formato XML generado por Tiled, que contiene una capa de patrones con tiles:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.11.2" orientation="orthogonal" renderorder="right-down" width="32" height="4" tilewidth="8" tileheight="8" infinite="0" nextlayerid="2" nextobjectid="1">
 <tileset firstgid="1" name="hud" tilewidth="8" tileheight="8" tilecount="64" columns="16">
  <image source="hud.png" width="128" height="32"/>
 </tileset>
 <layer id="1" name="Capa de patrones 1" width="32" height="4">
  <data encoding="csv">
1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
</data>
 </layer>
</map>

```

## Requisitos

Quiero crear un nuevo componente `extract-map-tileset` (de forma similar a extract-tiles.html) que pueda leer este archivo XML, extraer la información de los tiles y generar los archivos con el formato necesario para mi aplicación. El componente debera ser invocado desde el comando `extract-map-tileset` y debera tener:

- un input para cargar el archivo XML del mapa (el archivo con los tiles estara dado por el atributo `source` del elemento `image` dentro del `tileset`)
- un botón para iniciar el proceso de extracción
- una sección para mostrar los resultados obtenidos (por ejemplo, el número de tiles extraídos, el tamaño "en bytes" del mapa y el total de los tiles generados, el ancho y alto del mapa en tiles y cualquier otra información relevante), por ultimo una imagen de vista previa del mapa generado a partir de los tiles extraídos.
- los archivos tendran la misma estructura que los generados por el componente `extract-tiles`, pero adaptados a la información del mapa (siempre pensando en la optimizacion ya que es para aplicaciones en ordenadores de 8 bits)

## Criterios de aceptación

- El componente debe ser capaz de leer el archivo XML del mapa y extraer correctamente la información de los tiles.
- El proceso de extracción debe generar los archivos necesarios con el formato adecuado para la aplicación.
- La sección de resultados debe mostrar información precisa sobre el proceso de extracción, incluyendo el número de tiles extraídos, el tamaño del mapa en bytes, el total de tiles generados, el ancho y alto del mapa en tiles, y una imagen de vista previa del mapa generado.

Para cualquier duda o aclaración, por favor no dudes en preguntar.
