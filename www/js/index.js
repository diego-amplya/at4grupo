$(document).ready(function () { ////////////////////////////////////////////////

    autor = false;
    nombre_usuario = undefined;
    contraseña = undefined;

    $("textarea").jqte();

    // Device Event Listener ///////////////////////////////////////////////////
    document.addEventListener("deviceready", onDeviceReady, false);

    // se recuperan los datos de acceso guardados //////////////////////////////
    if (localStorage.uname !== undefined) {
        $("#email").val(localStorage.uname);
    }

    if (localStorage.upass !== undefined) {
        $("#contrasenya").val(localStorage.upass);
    }

    // evento: clic en Iniciar sesión //////////////////////////////////////////
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
        } else if ($('#guardar-datos').is(':not(:checked)')) {

            window.localStorage.clear();
        }

        // se llama a la función que recupera las categorías si el usuario es válido
        // esta misma función nos sirve de login pues, si el usuario no es válido,
        // no podrá acceder al resto de la aplicación
        ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get';
        wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/categories?order=desc';
        obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, mostrarCategorias);
        // comprobar si el usuario es autor
        ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get';
        wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/users/me?context=edit';
        obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, habilitarAutor);
    });

    // evento: clic en proyecto ////////////////////////////////////////////////
    $('#lista-proyectos').on('click', 'li a', function (e) {

        $.mobile.loading('show', {
            text: "Cargando...",
            textVisible: true,
            theme: "a"
        });
        // se recuperan las entradas del proyecto clicado
        project_id = $(this).data('proyecto-id');
        project_name = $(this).data('proyecto-nombre');
        argumentos = {id: project_id, nombre: project_name};
        ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get';
        wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/posts/?per_page=100&categories=' + project_id;
        obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, mostrarEntradas, argumentos);
        if (autor === true) {
            console.log('autor: ' + autor);
            $('.btn-volver').attr('style', 'width: 75% !important');
            $('.btn-crear-entrada').attr('style', 'display: block !important');
        }
    });

    // evento: clic en crear entrada ///////////////////////////////////////////
    $('.btn-crear-entrada').on('click', function (e) {
        // se resetea el formulario
        $('#titulo').val('');
        $('.jqte_editor').html(''); // equivalente al textarea #ta-contenido
        $('#fotos').html('<div class="foto"><button class="eliminar">X</button><input type="file" name="imagen"><img src="" style="display:none; width: 100%" /></div>');
    });

    // evento: clic para eliminar entrada //////////////////////////////////////
    $('#lista-entradas').on('click', 'li > .eliminar', function (e) {

        id = $(this).data('entrada-id');
        //alert(id);
        var eliminar = confirm("¿Eliminar esta entrada?");
        if (eliminar === true) {
            ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_delete_post';
            wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/posts/' + id;
            $.post(ws_url,
                    {
                        data: '{"name":"' + nombre_usuario + '", "password":"' + contrasenya + '", "url":"' + wp_url + '"}'
                    },
                    function (response, txtStatus, xhr) {
                        console.log('Response: ', response);

                        $.mobile.loading('show', {
                            text: "Cargando...",
                            textVisible: true,
                            theme: "a"
                        });
                        // se refresca la lista de entradas
                        project_id = sessionStorage.proyecto_id;
                        project_name = sessionStorage.proyecto_nombre;
                        argumentos = {id: project_id, nombre: project_name};
                        ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get';
                        wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/posts/?per_page=100&categories=' + project_id;

                        obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, mostrarEntradas, argumentos);
                    });
        }
    });

    // evento: clic en entrada /////////////////////////////////////////////////
    /*$('#lista-entradas').on('click', 'li > a', function (e) {
     
     $.mobile.loading('show', {
     text: "Cargando...",
     textVisible: true,
     theme: "a"
     });
     
     post_id = $(this).data('entrada-id');
     project_name = $(this).data('proyecto-nombre');
     argumentos = {id: post_id, nombre: project_name};
     url = 'http://proyectos.web-dvl.com/wp-json/wp/v2/posts/' + post_id;
     obtenerDatos(nombre_usuario, contrasenya, url, mostrarEntrada, argumentos);
     });*/

    // evento: clic en salir de edición ////////////////////////////////////////
    $('#confirmar-volver .si').on('click', function () {

        window.location.assign("#posts-list");
    });
    $('#confirmar-volver .no').on('click', function () {

        $("#confirmar-volver").popup("close");
    });

    // evento: cambio en un selector de archivo ////////////////////////////////
    $('#fotos').on('change', '.foto input', function (e) {

        var tmppath = URL.createObjectURL(e.target.files[0]);
        $(this).parents('.foto').children('img').fadeIn('fast').attr('src', tmppath);
        $(this).parents('.foto').children('.eliminar').fadeIn('fast');
        $(this).parents('.foto').children('div').css('display', 'none');
        $('#fotos').append('<div class="foto"><button class="eliminar ui-btn ui-shadow ui-corner-all">X</button><div class="ui-input-text ui-body-inherit ui-corner-all ui-shadow-inset"><input type="file"></div><img src="" style="display:none; width: 100%" /></div>');
    });

    // evento: click en eliminar foto del formulario ///////////////////////////
    $('#fotos').on('click', '.foto button', function (e) {
        $(this).parent().remove();
    });

    // evento: clic en Publicar ////////////////////////////////////////////////
    $('.btn-publicar').on('click', function () {

        $.mobile.loading('show', {
            text: "Enviando...",
            textVisible: true,
            theme: "a"
        });

        var contenido = $('#ta-contenido').val();

        var fotos = $('.foto input');
        console.log('Fotos:', fotos);

        var i = 0;

        $.each(fotos, function (index, foto) {

            var foto_data = $(foto).prop('files')[0];
            //console.log('Foto:', foto_data);

            if (foto_data !== undefined) {

                var formData = new FormData();
                formData.append('name', nombre_usuario);
                formData.append('password', contrasenya);
                formData.append('url', 'http://clientes.at4grupo.es/wp-json/wp/v2/media/');
                formData.append('photo', foto_data);
                // Display the key/value pairs
                //for (var pair of formData.entries()) {
                //    console.log(pair[0] + ', ' + pair[1]);
                //}

                $.ajax({
                    async: true,
                    crossDomain: true,
                    url: "http://clientes.at4grupo.es/webservice/?function=wp_fx_insert_photo",
                    method: "POST",
                    processData: false,
                    contentType: false,
                    mimeType: "multipart/form-data",
                    data: formData,
                    success: function (response, txtStatus, xhr) {
                        response = JSON.parse(response);
                        // console.log('Respuesta:', response);
                        var ruta_foto = '<img src="' + response.source_url + '"  alt=""  class="alignnone size-full"><br><br>';
                        // console.log('Ruta foto:', ruta_foto);

                        contenido = ruta_foto + contenido;

                        i++;

                        if (i === (fotos.length - 1)) {

                            ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_insert_post';

                            var options = {
                                name: nombre_usuario,
                                password: contrasenya,
                                url: 'http://clientes.at4grupo.es/wp-json/wp/v2/posts/',
                                status: 'publish',
                                categories: sessionStorage.proyecto_id,
                                title: $('#titulo').val(),
                                content: contenido
                            };
                            options = JSON.stringify(options);
                            $.post(ws_url,
                                    {
                                        data: options
                                    },
                                    function (response, txtStatus, xhr) {
                                        console.log('Response: ', response);

                                        // se refresca la lista de entradas
                                        project_id = sessionStorage.proyecto_id;
                                        project_name = sessionStorage.proyecto_nombre;
                                        argumentos = {id: project_id, nombre: project_name};
                                        ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get';
                                        wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/posts/?per_page=100&categories=' + project_id;

                                        obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, mostrarEntradas, argumentos);
                                    });
                        } // end if
                    },
                    error: function (textStatus, errorThrown) {

                        console.log(textStatus + ' ' + errorThrown);
                    }
                });
            } // end if
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
 * @name obtenerDatos
 * @param {string} nombre_usuario
 * @param {string} contrasenya
 * @param {string} ws_url
 * @param {string} wp_url
 * @param {string} callback
 * @param {any} argumentos
 * @returns {undefined}
 */
function obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, callback, argumentos) {

    console.log('@obtenerDatos');
    $.post(ws_url,
            {
                data: '{"name":"' + nombre_usuario + '", "password":"' + contrasenya + '", "url":"' + wp_url + '"}'
            },
            function (data, txtStatus, xhr) {
                // console.log('Data: ', data);
                data = JSON.parse(data);
                // se llama a la función pasada como callback
                if (argumentos === undefined) {
                    // sin argumentos
                    callback(data);
                } else {
                    // con argumentos
                    callback(data, argumentos);
                }
            });
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @name mostrarCategorias
 * @param {array} categorias 
 */
function mostrarCategorias(categorias) {

    console.log('@mostrarCategorias');
    if (categorias.length < 2) {

        $.mobile.loading('hide');
        $('#login-error').css('display', 'block');
        return false;
    }
    ;
    $('#login-error').css('display', 'none');
    window.location.assign("#categories-list");
    var html = '';
    $.each(categorias, function (indice, proyecto) {
        // console.log(proyecto);
        // console.log(proyecto.slug);
        // El ID 1 corresponde a 'Sin Categoría'
        if (proyecto.id === 1) {
            return;
        }

        html += '<li>' +
                '<div class="imagen-proyecto">' +
                '<img src="' + proyecto.description + '">' +
                '</div>' +
                '<div class="entradas-proyecto">' +
                '<a href="#" data-proyecto-id="' + proyecto.id + '" data-proyecto-nombre="' + proyecto.name + '">' + proyecto.name + '</a>' +
                '</div>' +
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
    // console.log(proyecto);

    $('#lista-entradas').html('');
    window.location.assign("#posts-list");
    sessionStorage.proyecto_id = proyecto.id;
    sessionStorage.proyecto_nombre = proyecto.nombre;
    $('.titulo-proyecto').html(proyecto.nombre);
    $.each(entradas, function (indice, entrada) {
        // console.log(entrada);

        var html = '';
        html += '<li>' +
                '<button class="eliminar ui-btn ui-shadow ui-corner-all" data-entrada-id="' + entrada.id + '">X</button>' +
                '<a href="#" data-proyecto-nombre="' + proyecto.nombre + '">' +
                entrada.title.rendered +
                '<br>' +
                '<span>' + entrada.modified.substr(0, 10) + '</span>' +
                '<br>' +
                '<br>' +
                '<div class="cuerpo-entrada">' + entrada.content.rendered + '</div>' +
                '</a>' +
                '</li>';
        $('#lista-entradas').append(html);
        $('.cuerpo-entrada img').attr('height', '');
    });

    // para el jefe de obra se muestra el botón de eliminar la entrada
    if (autor === true) {
        $('#lista-entradas > li > .eliminar').css('display', 'block');
    }

    $.mobile.loading("hide");
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