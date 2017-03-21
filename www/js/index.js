$(document).ready(function () { ////////////////////////////////////////////////

    autor = false;
    nombre_usuario = undefined;
    contraseña = undefined;

    $("textarea").jqte();

    // Device Event Listener ---------------------------------------------------
    document.addEventListener("deviceready", onDeviceReady, false);

    // se recuperan los datos de acceso guardados ------------------------------
    if (localStorage.uname !== undefined) {
        $("#email").val(localStorage.uname);
    }

    if (localStorage.upass !== undefined) {
        $("#contrasenya").val(localStorage.upass);
    }

    // evento: clic en Iniciar sesión ------------------------------------------
    $('#login-btn').click(function (e) {

        $.mobile.loading('show', {
            text: "Accediendo...",
            textVisible: true,
            theme: "a"
        });

        // Se recogen los datos del formulario
        nombre_usuario = $("#email").val();
        console.log(nombre_usuario);
        contrasenya = $("#contrasenya").val();
        console.log(contrasenya);

        if ($('#guardar-datos').is(':checked')) {
            
            localStorage.uname = $("#email").val();
            localStorage.upass = $("#contrasenya").val();
            
        } else if ($('#guardar-datos').is(':not(:checked)')){
            
            window.localStorage.clear();
        }

        // se llama a la función que recupera las categorías si el usuario es válido
        // esta misma función nos sirve de login pues, si el usuario no es válido,
        // no podrá acceder al resto de la aplicación
        url = 'http://dvl.franciscobosch.es/wp-json/wp/v2/categories';
        obtenerDatos(nombre_usuario, contrasenya, url, mostrarCategorias);

        // comprobar si el usuario es autor
        url = 'http://dvl.franciscobosch.es/wp-json/wp/v2/users/me?context=edit';
        obtenerDatos(nombre_usuario, contrasenya, url, habilitarAutor);
    });

    // evento: clic en proyecto ------------------------------------------------
    $('#lista-proyectos').on('click', 'li > a', function (e) {

        $.mobile.loading('show', {
            text: "Cargando...",
            textVisible: true,
            theme: "a"
        });

        project_id = $(this).data('proyecto-id');
        project_name = $(this).data('proyecto-nombre');
        argumentos = {id: project_id, nombre: project_name};
        url = 'http://dvl.franciscobosch.es/wp-json/wp/v2/posts/?per_page=100&categories=' + project_id;
        obtenerDatos(nombre_usuario, contrasenya, url, mostrarEntradas, argumentos);

        if (autor === true) {
            console.log('autor: ' + autor);
            $('.btn-volver').attr('style', 'width: 72% !important');
            $('.btn-crear-entrada').attr('style', 'display: block !important');
        }
    });

    // evento: clic en entrada -------------------------------------------------
    $('#lista-entradas').on('click', 'li > a', function (e) {

        $.mobile.loading('show', {
            text: "Cargando...",
            textVisible: true,
            theme: "a"
        });

        post_id = $(this).data('entrada-id');
        project_name = $(this).data('proyecto-nombre');
        argumentos = {id: post_id, nombre: project_name};
        url = 'http://dvl.franciscobosch.es/wp-json/wp/v2/posts/' + post_id;
        obtenerDatos(nombre_usuario, contrasenya, url, mostrarEntrada, argumentos);
    });

    // evento: clic en Imagen destacada ----------------------------------------
    //$('#obtener-imagen-destacada').on('click', accessCamera);

    // evento: clic en salir de edición ----------------------------------------
    $('#confirmar-volver .si').on('click', function () {

        window.location.assign("#posts-list");
    });
    $('#confirmar-volver .no').on('click', function () {

        $("#confirmar-volver").popup("close");
    });

    // evento: clic en Publicar ------------------------------------------------
    $('.btn-publicar').on('click', function () {

        $.mobile.loading('show', {
            text: "Enviando...",
            textVisible: true,
            theme: "a"
        });

        var file_data = $("#imagen-destacada").prop("files")[0];
        console.log(file_data);
        var form_data = new FormData();
        form_data.append("file", file_data);

        jQuery.ajax({
            url: 'http://dvl.franciscobosch.es/wp-json/wp/v2/media/',
            method: 'POST',
            crossDomain: true,
            contentType: false,
            processData: false,
            cache: false,
            data: form_data,
            headers: {
                'authorization': 'Basic ' + Base64.encode(nombre_usuario + ':' + contrasenya),
                'content-disposition': 'attachment; filename=' + $('#imagen-destacada').val(),
            },
            success: function (response, txtStatus, xhr) {
                console.log(response.id);

                var options = {
                    categories: sessionStorage.proyecto_id,
                    content: $('#ta-contenido').val(),
                    featured_media: response.id,
                    status: 'publish',
                    title: $('#titulo').val()
                };

                var settings = {
                    "async": true,
                    "crossDomain": true,
                    "url": "http://dvl.franciscobosch.es/wp-json/wp/v2/posts/",
                    "method": "POST",
                    "headers": {
                        'authorization': 'Basic ' + Base64.encode(nombre_usuario + ':' + contrasenya),
                        "content-type": "application/json"
                    },
                    "processData": false,
                    "data": JSON.stringify(options)
                };

                $.ajax(settings).done(function (response) {
                    console.log(response);

                    argumentos = {id: sessionStorage.proyecto_id, nombre: sessionStorage.proyecto_nombre};
                    url = 'http://dvl.franciscobosch.es/wp-json/wp/v2/posts/?per_page=100&categories=' + project_id;
                    obtenerDatos(nombre_usuario, contrasenya, url, mostrarEntradas, argumentos);
                });

            },
            error: function (textStatus, errorThrown) {

                console.log(textStatus + ' ' + errorThrown);
            }
        });
    });


}); // Fin document ready //////////////////////////////////////////////////////

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @name onDeviceReady
 * @returns {undefined}
 */
function onDeviceReady() {

    console.log("El dispositivo está listo");
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @name obtenerEntradas
 * @param {string} nombre_usuario
 * @param {string} contrasenya
 * @returns {undefined}
 */
function obtenerDatos(nombre_usuario, contrasenya, url, callback, argumentos) {

    console.log('@obtenerDatos');

    jQuery.ajax({
        async: true,
        url: url,
        method: 'GET',
        crossDomain: true,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(nombre_usuario + ':' + contrasenya));
        },
        success: function (data, txtStatus, xhr) {
            console.log(data);
            console.log(xhr.status);

            // se llama a la función pasada como callback
            if (argumentos === undefined) {

                callback(data);
            } else {

                callback(data, argumentos);
            }
        },
        error: function (textStatus, errorThrown) {

            console.log(textStatus + ' ' + errorThrown);
        }
    });
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @name mostrarCategorias
 */
function mostrarCategorias(categorias) {

    console.log('@mostrarCategorias');

    window.location.assign("#categories-list");

    var html = '';
    $.each(categorias, function (indice, proyecto) {
        console.log(proyecto);

        if (proyecto.id === 1) {
            return;
        }

        html += '<li>' +
                '<a href="#" data-proyecto-id="' + proyecto.id + '" data-proyecto-nombre="' + proyecto.name + '">' +
                proyecto.name +
                '</a>' +
                '</li>';
    });
    $('#lista-proyectos').html('');
    $('#lista-proyectos').append(html);
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @name mostrarEntradas
 * @param {type} entradas
 * @param {type} proyecto
 * @returns {undefined}
 */
function mostrarEntradas(entradas, proyecto) {

    console.log('@mostrarEntradas');
    console.log(proyecto);

    $('#lista-entradas').html('');
    window.location.assign("#posts-list");

    sessionStorage.proyecto_id = proyecto.id;
    sessionStorage.proyecto_nombre = proyecto.nombre;

    $('.titulo-proyecto').html(proyecto.nombre);

    $.each(entradas, function (indice, entrada) {
        console.log(entrada);

        var html = '';
        html += '<li>' +
                '<a href="#" data-proyecto-nombre="' + proyecto.nombre + '" data-entrada-id="' + entrada.id + '">' +
                entrada.title.rendered +
                '<br>' +
                '<span>' + entrada.modified.substr(0, 10) + '</span>' +
                '<br>' +
                '<br>' +
                '<img src="" class="featured_img" data-featured-media="' + entrada.featured_media + '">' +
                '</a>' +
                '</li>';
        $('#lista-entradas').append(html);

        jQuery.ajax({
            url: 'http://dvl.franciscobosch.es/wp-json/wp/v2/media/' + entrada.featured_media,
            method: 'GET',
            crossDomain: true,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(nombre_usuario + ':' + contrasenya));
            },
            success: function (media, txtStatus, xhr) {
                console.log(media);
                console.log(xhr.status);
                $('.featured_img[data-featured-media="' + media.id + '"]').attr('src', media.source_url);
            },
            error: function (textStatus, errorThrown) {

                console.log(textStatus + ' ' + errorThrown);
            }
        });
    });
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @name mostrarEntrada
 */
function mostrarEntrada(entrada, proyecto) {

    console.log('@mostrarEntrada');

    window.location.assign("#single-post");

    $('.titulo-proyecto').html(proyecto.nombre);
    $('#titulo-entrada').html(entrada.title.rendered);
    $('#texto-entrada').html(entrada.content.rendered);
    $('#fecha-entrada').html(entrada.modified.substr(0, 10));
    $('#texto-entrada img').attr('height', '');
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @name habilitarAutor
 * @param {object} registro 
 */
function habilitarAutor(registro) {

    console.log('@habilitarAutor');

    if (registro.roles[0] === 'author') {

        autor = true;
    }
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @param {type} imgData
 * @returns {undefined}
 */
function camSuccess(imgData) {

    $('#imagen-destacada').attr('src', imgData);
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @param {type} error
 * @returns {undefined}
 */
function camError(error) {

    alert(error);
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @returns {undefined}
 */
function accessCamera() {

    var options = {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY
    };

    navigator.camera.getPicture(camSuccess, camError, options);
}