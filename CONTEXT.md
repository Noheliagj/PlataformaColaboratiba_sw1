# PROYECTO: Plataforma colaborativa para modelado de software

## OBJETIVO
Desarrollar una plataforma web colaborativa que permita crear y editar diagramas de clases, generar autom�ticamente un modelo de base de datos derivado, utilizar IA para crear/modificar diagramas, importar/exportar XMI 2.1 y generar un backend Spring Boot a partir del modelo.

El proyecto es individual y tenemos 14 d�as para terminarlo. Priorizar un MVP funcional, demostrable y estable sobre funcionalidades avanzadas.

## STACK TECNOL�GICO
- Frontend web: React + Vite + TypeScript + React Flow
- Backend plataforma: NestJS + TypeScript + Prisma + PostgreSQL + JWT + Passport + WebSockets
- IA: API externa de IA (operaciones estructuradas sobre el modelo, no toca la BD directamente)
- XMI: Subconjunto XMI 2.1 (clases, atributos, m�todos, asociaciones, herencia)
- Generador: TypeScript + plantillas (fuente de verdad: modelo de clases)
- Backend generado: Spring Boot + Java 21 (Entity/JPA, Repository, Service, REST Controller, CRUD, exportable en ZIP, testeable con Postman)
- Cliente m�vil: Expo + React Native (creado manualmente, consume el backend generado, CRUD, voz, offline + sync)

## REQUISITOS PRINCIPALES:

RF1 Registro
RF2 Login
RF3 Crear/listar/eliminar proyectos
RF4 Invitar colaboradores
RF5 Crear diagramas de clases
RF6 Crear/editar/eliminar clases, atributos y métodos
RF7 Crear asociaciones y herencia
RF8 Generar/vista de modelo de base de datos
RF9 Persistencia automática
RF10 Colaboración en tiempo real
RF11 Crear/modificar diagramas mediante IA
RF12 Exportar XMI 2.1
RF13 Importar XMI 2.1
RF14 Generar backend Spring Boot
RF15 CRUD REST en backend generado
RF16 Descargar backend generado
RF17 Cliente sencillo para consumir API
RF18 Operación mediante voz
RF19 Funcionamiento offline + sincronización

## REGLAS ESTRICTAS
1. No cambiar el stack sin consultarme.
2. No agregar tecnolog�as innecesarias (NO microservicios, NO 1. No cambiar el stack sin consultarme.
2. No agregar tecnologías innecesarias.
3. No implementar microservicios.
4. No usar Docker salvo que sea estrictamente necesario.
5. No implementar CRDT/OT.
6. No generar automáticamente una aplicación móvil desde el
   diagrama. El cliente móvil será desarrollado manualmente.
7. No confundir el backend de la plataforma con el backend generado.
8. El backend de la plataforma es NestJS.
9. El backend generado por la plataforma es Spring Boot + Java 21.
10. Priorizar siempre las funcionalidades necesarias para la demo.
11. Antes de hacer cambios arquitectónicos importantes, explicar
    la decisión y esperar aprobación.
12. Trabajar incrementalmente y comprobar que cada parte funciona
    antes de continuar.
13. No instalar dependencias que todavía no sean necesarias.
14. Mantener código limpio, modular y fácil de explicar en una
    defensa académica.
