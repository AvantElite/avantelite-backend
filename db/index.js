// Punto único de acceso a la capa de datos.
// Cada dominio expone funciones nombradas (getProducto, listProductos, etc.).
// Las rutas NO deben llamar SQL directamente — solo importar de aquí.
//
// Uso:
//   const { roles, tiposProblema } = require('./db/index');
// (Importante: usa './db/index' explícito mientras el legacy './db.js' siga existiendo,
//  porque Node resuelve './db' al fichero antes que a la carpeta.)

module.exports = {
    client:        require('./client'),
    analytics:     require('./analytics'),
    appConfig:     require('./app_config'),
    averias:       require('./averias'),
    blog:          require('./blog'),
    chat:          require('./chat'),
    contactos:     require('./contactos'),
    maintenance:   require('./maintenance'),
    migrations:    require('./migrations'),
    presupuestos:  require('./presupuestos'),
    rag:           require('./rag'),
    roles:         require('./roles'),
    servicios:     require('./servicios'),
    sesiones:      require('./sesiones'),
    store:         require('./store'),
    tiposProblema: require('./tipos_problema'),
    usuarios:      require('./usuarios'),
};
