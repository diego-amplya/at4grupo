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

        // comprobar el usuario
        ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get';
        wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/users/me?context=edit';
        obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, habilitarUsuario);

    });

    // evento: clic en un filtro del jefe de obra //////////////////////////////
    $('.btn-filter').on('click', function () {

        var estado = $(this).data('filtro');
        // se llama a la función que recupera las categorías
        ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get_projects_with_date';
        wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/categories?order=desc';
        obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, mostrarCategoriasJefeObra, estado);
    });

    // evento: clic en proyecto ////////////////////////////////////////////////
    $('.lista-proyectos').on('click', 'li', function (e) {

        $.mobile.loading('show', {
            text: "Cargando...",
            textVisible: true,
            theme: "a"
        });
        // se recuperan las entradas del proyecto clicado
        project_id = $(this).data('proyecto-id');
        project_name = $(this).data('proyecto-nombre');
        project_prescriber = $(this).data('proyecto-prescriptor');
        argumentos = {id: project_id, nombre: project_name, prescriptor: project_prescriber};
        ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get';
        wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/posts/?per_page=100&categories=' + project_id;
        obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, mostrarEntradas, argumentos);
        if (autor === true) {
            console.log('autor: ' + autor);
            $('.btn-crear-entrada').attr('style', 'display: block !important');
        }
    });

    // evento: clic en volver desde la lista de entradas ///////////////////////
    $('#back-from-posts-list').on('click', function () {
        if (autor === true) {
            window.location.assign("#categories-list-author");
        } else {
            window.location.assign("#categories-list-subscriber");
        }
    });

    // evento: clic en crear entrada ///////////////////////////////////////////
    $('.btn-crear-entrada').on('click', function (e) {
        // se resetea el formulario
        $('#titulo').val('');
        $('.jqte_editor').html(''); // equivalente al textarea #ta-contenido
        $('#fotos').html('<div class="foto"><button class="eliminar"></button><input type="file" name="imagen"><img src="" style="display:none; width: 100%" /></div>');
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
                        project_prescriber = sessionStorage.proyecto_prescriptor;
                        argumentos = {id: project_id, nombre: project_name, prescriptor: project_prescriber};
                        ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get';
                        wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/posts/?per_page=100&categories=' + project_id;

                        obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, mostrarEntradas, argumentos);
                    });
        }
    });

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
        $(this).parents('.foto').children('input').css('display', 'none');
        $(this).parents('.foto').children('div').css('display', 'none'); // esta
        // línea es necesaria porque la primera vez que se inserta el html jQuery
        // mobile envuelve el input en un div
        $('#fotos').append('<div class="foto"><button class="eliminar ui-btn ui-corner-all"></button><div class="ui-input-text ui-body-inherit ui-corner-all ui-shadow-inset"><input type="file"></div><img src="" style="display:none; width: 100%" /></div>');
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
                                        project_prescriber = sessionStorage.proyecto_prescriptor;
                                        argumentos = {id: project_id, nombre: project_name, prescriptor: project_prescriber};
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

    // evento: clic en "Documental" ////////////////////////////////////////////
    $('#view-documents').on('click', function (e) {

        $.post('http://clientes.at4grupo.es/webservice/?function=get_documents_list',
                {
                    data: '{"id":"' + sessionStorage.proyecto_id + '"}'
                },
                function (data, txtStatus, xhr) {
                    
                    console.log('Docs: ', data, typeof data);

                    if (data === 'false' || data === '[".",".."]') {

                        $("#sin-resultados").popup('open');
                        setTimeout(function(){ $( "#sin-resultados" ).popup( "close" ) }, 3000);

                    } else {

                        var docs = JSON.parse(data);
                        docs.splice(0, 2);
                        console.log('Data: ', docs);

                        var html = '';

                        $.each(docs, function (index, value) {

                            html += '<li><a href="http://clientes.at4grupo.es/wp-content/uploads/0_PROYECTOS/' + sessionStorage.proyecto_id + '/' + value + '">' + value + '</a></li>';
                        });

                        $('#lista-documentos').html(html);

                        window.location.assign('#documents');
                    }
                });
    });

    // evento: click en Cerrar sesión //////////////////////////////////////////
    $('.exit').on('click', function (e) {
        location.assign('#login');
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

                data = JSON.parse(data);
                console.log('Data: ', data);

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
 * @name habilitarUsuario
 * @param {object} registro 
 */
function habilitarUsuario(registro) {

    console.log('habilitarUsuario');
    console.log(registro);

    if (registro.roles !== undefined) {

        if (registro.roles[0] === 'author') {

            autor = true;

            $('#login-error').css('display', 'none');

            window.location.assign("#filters-page");

        } else if (registro.roles[0] === 'subscriber') {

            $('#login-error').css('display', 'none');

            // se llama a la función que recupera las categorías
            ws_url = 'http://clientes.at4grupo.es/webservice/?function=wp_fx_get_projects_with_date';
            wp_url = 'http://clientes.at4grupo.es/wp-json/wp/v2/categories?order=desc';
            obtenerDatos(nombre_usuario, contrasenya, ws_url, wp_url, mostrarCategoriasCliente);

        }

    } else {

        $.mobile.loading('hide');
        $('#login-error').css('display', 'block');
        return false;
    }
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @name mostrarCategoriasJefeObra
 * @param {array} categorias 
 * @param {string} estado 
 */
function mostrarCategoriasJefeObra(categorias, estado) {

    console.log('@mostrarCategoriasJefeObra');

    window.location.assign("#categories-list-author");

    var en_espera = new String();
    var en_ejecucion = new String();
    var finalizados = new String();

    $.each(categorias, function (indice, proyecto) {
        // console.log(proyecto);
        // console.log(proyecto.slug);

        var descripcion = proyecto.description.split('=');
        console.log(descripcion);
        proyecto_imagen = descripcion[0];
        proyecto_estado = descripcion[1];
        proyecto_prescriptor = descripcion[2];

        switch (proyecto_estado) {
            case 'enespera':
                en_espera += '<li class="enespera" data-proyecto-id="' + proyecto.id + '" data-proyecto-nombre="' + proyecto.name + '" data-proyecto-prescriptor="' + proyecto_prescriptor + '">' +
                        '<div class="imagen-proyecto">' +
                        '<img src="' + proyecto_imagen + '">' +
                        '</div>' +
                        '<div class="entradas-proyecto">' +
                        '<a href="#">' + proyecto.name + '</a>' +
                        '<span>' + proyecto.date + '</span>' +
                        '</div>' +
                        '</li>';
                break;
            case 'enejecucion':
                en_ejecucion += '<li class="enejecucion" data-proyecto-id="' + proyecto.id + '" data-proyecto-nombre="' + proyecto.name + '" data-proyecto-prescriptor="' + proyecto_prescriptor + '">' +
                        '<div class="imagen-proyecto">' +
                        '<img src="' + proyecto_imagen + '">' +
                        '</div>' +
                        '<div class="entradas-proyecto">' +
                        '<a href="#">' + proyecto.name + '</a>' +
                        '<span>' + proyecto.date + '</span>' +
                        '</div>' +
                        '</li>';
                break;
            case 'finalizado':
                finalizados += '<li class="finalizados" data-proyecto-id="' + proyecto.id + '" data-proyecto-nombre="' + proyecto.name + '" data-proyecto-prescriptor="' + proyecto_prescriptor + '">' +
                        '<div class="imagen-proyecto">' +
                        '<img src="' + proyecto_imagen + '">' +
                        '</div>' +
                        '<div class="entradas-proyecto">' +
                        '<a href="#">' + proyecto.name + '</a>' +
                        '<span>' + proyecto.date + '</span>' +
                        '</div>' +
                        '</li>';
        }
    });
    $('#lista-proyectos-jefeobra').html('');
    $('#lista-proyectos-jefeobra').append(en_espera).append(en_ejecucion).append(finalizados);

    console.log(estado);
    switch (estado) {
        case 'enespera':
            $('li.enespera').css('display', 'block');
            break;
        case 'enejecucion':
            $('li.enejecucion').css('display', 'block');
            break;
        case 'finalizados':
            $('li.finalizados').css('display', 'block');
            break;
        default:
            $('#lista-proyectos-jefeobra li').css('display', 'inherit');
    }
}

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * @name mostrarCategoriasCliente
 * @param {array} categorias 
 */
function mostrarCategoriasCliente(categorias) {

    console.log('mostrarCategoriasCliente');

    window.location.assign("#categories-list-subscriber");

    var en_espera = new String();
    var en_ejecucion = new String();
    var finalizados = new String();

    $.each(categorias, function (indice, proyecto) {
        // console.log(proyecto);
        // console.log(proyecto.slug);

        var descripcion = proyecto.description.split('=');
        console.log(descripcion);
        proyecto_imagen = descripcion[0];
        proyecto_estado = descripcion[1];
        proyecto_prescriptor = descripcion[2];

        switch (proyecto_estado) {
            case 'enespera':
                en_espera += '<li data-proyecto-id="' + proyecto.id + '" data-proyecto-nombre="' + proyecto.name + '" data-proyecto-prescriptor="' + proyecto_prescriptor + '">' +
                        '<div class="imagen-proyecto">' +
                        '<img src="' + proyecto_imagen + '">' +
                        '</div>' +
                        '<div class="entradas-proyecto">' +
                        '<a href="#">' + proyecto.name + '</a>' +
                        '<span>' + proyecto.date + '</span>' +
                        '</div>' +
                        '</li>';
                break;
            case 'enejecucion':
                en_ejecucion += '<li data-proyecto-id="' + proyecto.id + '" data-proyecto-nombre="' + proyecto.name + '" data-proyecto-prescriptor="' + proyecto_prescriptor + '">' +
                        '<div class="imagen-proyecto">' +
                        '<img src="' + proyecto_imagen + '">' +
                        '</div>' +
                        '<div class="entradas-proyecto">' +
                        '<a href="#">' + proyecto.name + '</a>' +
                        '<span>' + proyecto.date + '</span>' +
                        '</div>' +
                        '</li>';
                break;
            default:
                finalizados += '<li data-proyecto-id="' + proyecto.id + '" data-proyecto-nombre="' + proyecto.name + '" data-proyecto-prescriptor="' + proyecto_prescriptor + '">' +
                        '<div class="imagen-proyecto">' +
                        '<img src="' + proyecto_imagen + '">' +
                        '</div>' +
                        '<div class="entradas-proyecto">' +
                        '<a href="#">' + proyecto.name + '</a>' +
                        '<span>' + proyecto.date + '</span>' +
                        '</div>' +
                        '</li>';
        }
    });
    $('#lista-proyectos-cliente').html('');
    $('#lista-proyectos-cliente').append(en_espera).append(en_ejecucion).append(finalizados);
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
    sessionStorage.proyecto_prescriptor = proyecto.prescriptor;
    $('.titulo-proyecto').html(proyecto.nombre);
    $('.prescriptor').html(proyecto.prescriptor);
    $.each(entradas, function (indice, entrada) {
        // console.log(entrada);

        var html = '';
        html += '<li>' +
                '<button class="eliminar ui-btn ui-shadow ui-corner-all" data-entrada-id="' + entrada.id + '"></button>' +
                '<a href="#" data-proyecto-nombre="' + proyecto.nombre + '">' +
                entrada.title.rendered +
                '<br>' +
                '<span>' + entrada.modified.substr(0, 10).split('-').reverse().join('-') + '</span>' +
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