<?php
/** Respuesta al bot de whatsapp
 * Version 5.1 - DEFINITIVA (SEGURA + LÓGICA CORREGIDA)
 * 2025-09-18
 * Alberto Arias / Asistente AI
 */
session_start();
$_SESSION['crsft'] = '2010-2016';
include_once('../functions/db_connect.inc.php');
include_once('../functions/mainFunctions.php');
$realIP = realIP();
$app_name = $_POST['app'];
$sender = $_POST['sender'];
$message = $_POST['message'];
$phone = $_POST['phone'];
$group_name = $_POST['group_name'];
$dt = new DateTime('now', new DateTimeZone('America/Guayaquil'));
$hora = $dt->format('H:i');
$hoy = $dt->format('Y-m-d');
$ano = $dt->format('Y');
$eol = "\n";
/** SECCION FUNCIONES */
function goBack($conn, $rowt){

    $campo = '';
    $campoAtras = '';
    if (empty($rowt['responseEspecialidad'])) {
        $campo = 'responseDispensario=null,responseCedula=null';
        $campoAtras = $rowt['responseCedula'];
        $sel=1;
    } elseif (empty($rowt['responseMedico'])) {
        $campo = 'responseEspecialidad=null,responseDispensario=null';
        $campoAtras = $rowt['responseDispensario'];
        $sel=2;
    } elseif (empty($rowt['responseFecha'])) {
        $campo = 'responseMedico=null,responseEspecialidad=null';
        $campoAtras = $rowt['responseEspecialidad'];
        $sel=3;
    } elseif (empty($rowt['responseHora'])) {
        $campo = 'responseFecha=null,responseMedico=null';
        $campoAtras = $rowt['responseMedico'];
        $sel=4;
    } elseif (empty($rowt['responseConfirma'])) {
        $campo = 'responseHora=null,responseFecha=null';
        $campoAtras = $rowt['responseFecha'];
        $sel=5;
    }

    // CORREGIDO: Consulta preparada para seguridad
    $sql="select numeral from chatOpcion where idChatMensaje=? and idTabla=? and idChbSeleccion=?";
    $i=0;
    $rs=$conn->prepare($sql);
    $rs->bindParam(++$i, $rowt['idChatMensaje']);
    $rs->bindParam(++$i, $campoAtras);
    $rs->bindValue(++$i, ($sel-1));
    $rs->execute();
    if($row=$rs->fetch(PDO::FETCH_ASSOC)){
        $campoAtras=$row['numeral'];
    }

    // CORREGIDO: Consulta preparada para seguridad
    $sql="delete from chatOpcion where idChatMensaje=? and idChbSeleccion>=?";
    $i=0;
    $sen=$conn->prepare($sql);
    $sen->bindParam(++$i, $rowt['idChatMensaje']);
    $sen->bindParam(++$i, $sel);
    $sen->execute() or die(json_encode(array(0,'Error al Eliminar')));

    $sql = "update chatMensaje set ".$campo." where idChatMensaje=?";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $rowt['idChatMensaje']);
    $sen->execute() or die(json_encode(array(0,'Error al actualizar')));
    return ($campoAtras);
}
function newThread($conn,$message,$eol="\n"){
    $lasOpciones = array('1. CITA', '2. MIS CITAS PROGRAMADAS', '3. MIS CITAS PASADAS');
    $menu = array('cita', 'mis citas programadas', 'mis citas pasadas', '1', '2', '3', 'pasadas', 'programadas', 'citas programadas', 'citas pasadas');
    $palabras = strtolower($message);
    if (!in_array($palabras, $menu)) {
        return(json_encode(array('reply' => '🚫 No reconozco ninguna de esas peticiones, las posibles opciones son:' . $eol . '*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS' . $eol . $eol . '💡 *RECUERDA:  Siempre debes escribir en tu mensaje solamente el número de la opción que estas escogiendo*')));
    }
    $opc = '';
    switch ($message) {
        case 'cita': case '1':
            $opc = $lasOpciones[0];
            break;
        case 'mis citas programadas': case 'citas programadas': case '2': case 'programadas':
            $opc = $lasOpciones[1];
            break;
        case 'mis citas pasadas': case 'citas pasadas': case '3': case 'pasadas':
            $opc = $lasOpciones[2];
            break;
    }
    $sql = "insert into chatMensaje (phone,fechaInicio,tipoConsulta,fechaRespuesta) values(?,now(),?,now())";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $_POST['phone']);
    $sen->bindParam(++$i, $message);
    $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al leer cabecera')));

    return (json_encode(array('reply' => '👋🏻 Has seleccionado la opción: *' . $opc . '*' . $eol . ' Escribe tu número de cédula 💳 para identificarte y continuar con el proceso')));
}
function restartThread($conn,$usuario,$eol="\n"){
    $sql = "delete from chatMensaje where idChatMensaje=?";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $usuario);
    $sen->execute() or die(json_encode(array('reply' => 'Error al Eliminar')));
    // MODIFICADO: Texto personalizado por el usuario
    return(json_encode(array('reply' => '🔴 Operacion cancelada, si quieres volver a empezar escribe el numero de la opcion que requieres:' . $eol . '*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS')));
}
function getPatient($conn,$message,$usuario,$eol="\n"){
    $sql = "select concat_ws(' ',nombres,apellidos) apenom,idPersona,pacienteISSFA from persona p left join tipoPaciente tp on p.idTipoPaciente=tp.idTipoPaciente where cedula=?";
    $i = 0;
    $rs = $conn->prepare($sql);
    $rs->bindParam(++$i, $message);
    $rs->execute();
    if (!$rowX = $rs->fetch(PDO::FETCH_ASSOC)) {
        // MODIFICADO: Se agrega el texto de ayuda adicional
        $replyText = '🚫 No hemos encontrado ese número de cédula en nuestros sistemas, si aun no estas registrado(a) como paciente ingresa en el siguiente enlace: https://medicalcare.ec/intranet/perfil/' . $eol . $eol . 'Vuelve a escribir tu número de cédula o escribe SALIR para empezar otra vez.' . $eol . $eol . 'Si tienes problemas creando tu cuenta escribe "asesor" o llama o escibe al +593984604041 para poder ayudarte.';
        return(json_encode(array('reply' => $replyText)));
    }

    $paciente = $rowX['apenom'];
    $pacienteISSFA = $rowX['pacienteISSFA'];

    $sql = "update chatMensaje set idPersona=?,responseCedula=?,fechaRespuesta=now(),pacienteISSFA=? where idChatMensaje=?";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $rowX['idPersona']);
    $sen->bindParam(++$i, $message);
    $sen->bindParam(++$i, $pacienteISSFA);
    $sen->bindParam(++$i, $usuario);
    $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al actualizar el idPersona')));

    $sql = "select idDispensario,descDispensario,direccion from dispensario where idBioEmpresa=1 and tipoDispensario='D' and idEstado=1 order by 2";
    $rs = $conn->prepare($sql);
    $rs->execute();
    $rows = $rs->fetchAll(PDO::FETCH_ASSOC);
    $opcion = '';
    $p = 1;
    foreach ($rows as $key => $value) {
        $opcion .= $eol . "▪️ *" . $p . ')* ' . $value['descDispensario'];
        $sql = "insert into chatOpcion (idChatMensaje,idChbSeleccion,numeral,idTabla,opcion) values(?,1,?,?,?)";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $usuario);
        $sen->bindParam(++$i, $p);
        $sen->bindParam(++$i, $value['idDispensario']);
        $sen->bindParam(++$i, $value['descDispensario']);
        $sen->execute() or die(json_encode(array(0, 'Error al insertar')));
        $p++;
    }
    if (empty($opcion)) {
        return(json_encode(array('reply' => 'No existen dispensarios habilitados')));
    }
    // MODIFICADO: Se ajusta la posición del icono
    return(json_encode(array('reply' => "🙂 Hola *" . $paciente . "*, vamos a guiarte en la obtención de tu cita médica." . $eol . "A continuación escribe el número del dispensario en el que quieres obtener tu cita: " . $eol . $opcion . "." . $eol . $eol . "⛔ O escribe *SALIR* para iniciar nuevamente el proceso")));
}
function getDispensarios($conn,$usuario,$eol="\n"){
    // CORREGIDO: Consulta preparada para seguridad
    $sql = "select idTabla from chatOpcion where idChatMensaje=? and idChbSeleccion=1 and (numeral=? or opcion like ?)";
    $i = 0;
    $rs = $conn->prepare($sql);
    $likeTerm = "%" . trim($_POST['message']) . "%";
    $rs->bindParam(++$i, $usuario);
    $rs->bindParam(++$i, $_POST['message']);
    $rs->bindParam(++$i, $likeTerm);
    $rs->execute();
    $res = $rs->rowCount();
    if ($res == 0) {
        return(json_encode(array('reply' => "🚫 Ese dispensario no está en la lista." . $eol . "Escribe el número del Dispensario en la lista ⛔ o escribe *SALIR* para empezar nuevamente")));
    }
    if ($res > 1) {
        return(json_encode(array('reply' => '🚫 El nombre coincide con mas de un dispensario en la lista, escribe un nombre mas especifico de un dispensario')));
    }
    $rowf = $rs->fetch(PDO::FETCH_ASSOC);

    // CORREGIDO: Consulta preparada para seguridad
    $sql = "select * from dispensario where idDispensario= ?";
    $rs = $conn->prepare($sql);
    $rs->bindParam(1, $rowf['idTabla']);
    $rs->execute();
    $rowf = $rs->fetch(PDO::FETCH_ASSOC);

    $sql = "update chatMensaje set responseDispensario=?,fechaRespuesta=now() where idChatMensaje=?";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $rowf['idDispensario']);
    $sen->bindParam(++$i, $usuario);
    $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al leer detalle')));

    $sql = "select idEspecialidad,descEspecialidad,detalle from especialidad where idDispensario=? and idEstado=1 order by 2";
    $rs = $conn->prepare($sql);
    $rs->bindParam(1, $rowf['idDispensario']);
    $rs->execute();
    $rows = $rs->fetchAll(PDO::FETCH_ASSOC);
    $opcion = '';
    $p = 1;
    foreach ($rows as $key => $value) {
        $opcion .= $eol . "*" . $p . ')* ' . $value['descEspecialidad'];
        $sql = "insert into chatOpcion (idChatMensaje,idChbSeleccion,numeral,idTabla,opcion) values(?,2,?,?,?)";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $usuario);
        $sen->bindParam(++$i, $p);
        $sen->bindParam(++$i, $value['idEspecialidad']);
        $sen->bindParam(++$i, $value['descEspecialidad']);
        $sen->execute() or die(json_encode(array(0, 'Error al insertar')));
        $p++;
    }

    if (empty($opcion)) {
        $sql = "update chatMensaje set responseDispensario=null where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $usuario);
        $sen->execute() or die(json_encode(array('reply' => 'Error al limpiar el nombre del dispensario')));;
        return(json_encode(array('reply' => '🚫 No existen Especialidades en ese dispensario, escriba el nombre de otro dispensario'.$eol . $eol . "Escribe *ATRAS* para regresar al menu anterior")));
    }
    $opcion .= $eol . $eol . "Escribe *ATRAS* para regresar al menu anterior";

    // MODIFICADO: Se ajusta la posición del icono
    return(json_encode(array('reply' => "Has seleccionado el *" . $rowf['descDispensario'] . "*" . $eol . " 🙂 Selecciona el número de la especialidad en la que quieres obtener su cita: " . $eol . $opcion . "." . $eol . $eol . "⛔ O escribe *SALIR* para iniciar nuevamente el proceso")));
}
function getEspecialidades($conn,$usuario,$pacienteISSFA,$persona,$dispensario,$eol="\n"){
    // CORREGIDO: Consulta preparada para seguridad
    $sql = "select idTabla from chatOpcion where idChatMensaje=? and idChbSeleccion=2 and (numeral=? or opcion like ?)";
    $i = 0;
    $rs = $conn->prepare($sql);
    $likeTerm = "%" . trim($_POST['message']) . "%";
    $rs->bindParam(++$i, $usuario);
    $rs->bindParam(++$i, $_POST['message']);
    $rs->bindParam(++$i, $likeTerm);
    $rs->execute();
    $res = $rs->rowCount();

    if ($res == 0) {
        return(json_encode(array('reply' => "🚫 Esa especialidad no está en la lista." . $eol . "Escribe el número de la especialidad en la lista, ⛔ o escribe *SALIR* para empezar otra vez")));
    }
    if ($res > 1) {
        return(json_encode(array('reply' => '🚫 El nombre coincide con mas de una especialidad en la lista, escribe un nombre mas especifico')));
    }

    $rowf = $rs->fetch(PDO::FETCH_ASSOC);
    // CORREGIDO: Consulta preparada para seguridad
    $sql = "select * from especialidad where idEspecialidad=?";
    $rs = $conn->prepare($sql);
    $rs->bindParam(1, $rowf['idTabla']);
    $rs->execute();
    $rowfe = $rs->fetch(PDO::FETCH_ASSOC);

    if ($pacienteISSFA == 'S') {
        // CORREGIDO: Consulta preparada para seguridad
        $sql = "select necesitaPrimerNivel from especialidad e
                join tipoEspecialidad te on e.idTipoEspecialidad=te.idTipoEspecialidad
                WHERE idEspecialidad=?";
        $rs = $conn->prepare($sql);
        $rs->bindParam(1, $rowf['idTabla']);
        $rs->execute();

        if ($rowK = $rs->fetch(PDO::FETCH_ASSOC) and $rowK['necesitaPrimerNivel'] == 'S') {
            // CORREGIDO: Consulta preparada para seguridad
            $sql = "select 1 existe from consultaPersona cp
                    join medico m on cp.idMedico=m.idMedico
                    join especialidad e on m.idEspecialidad=e.idEspecialidad
                    join tipoEspecialidad te on e.idTipoEspecialidad=te.idTipoEspecialidad
                    where idPersona=? and fechaConsulta >= date_sub(now(), interval 3 month)
                    and (m.idEspecialidad=? or te.idTipoEspecialidad=1)";
            $rs = $conn->prepare($sql);
            $rs->bindParam(1, $persona);
            $rs->bindParam(2, $rowf['idTabla']);
            $rs->execute();

            if (!$rowj = $rs->fetch(PDO::FETCH_ASSOC)) {
                $sql = "delete from chatMensaje where idPersona=? and idEstado=1";
                $i = 0;
                $sen = $conn->prepare($sql);
                $sen->bindParam(++$i, $persona);
                $sen->execute() or die(json_encode(array('reply' => 'Error al Eliminar')));
                return(json_encode(array('reply' => '🚫 Lo siento, eres un paciente ISSFA y no puedes tomar un turno en esa especialidad porque no registras en el sistema una cita previa con Medicina General o con la especialidad escogida, durante los ultimos 3 meses; debes tomar un turno con Medicina General para ser evaluado y derivado a la Especialidad' . $eol . ' *Escribe* ' . $eol . '*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS')));
            }
        }
    }

    $sql = "update chatMensaje set responseEspecialidad=?,fechaRespuesta=now() where idChatMensaje=?";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $rowf['idTabla']);
    $sen->bindParam(++$i, $usuario);
    $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al leer detalle')));

    $sql = "select distinct a.idMedico,concat_ws(' ',SUBSTRING_INDEX(codigoProfesional,',',-1),nombres,apellidos) apenom
            from medico a
            join usuario b on a.idUsuario=b.idUsuario
            join persona p on b.idPersona=p.idPersona
            join usuarioDispensario ud  on a.idUsuario=ud.idUsuario and ud.idDispensario=? and ud.idEspecialidad=?
            join horarioMedico mh on a.idMedico=mh.idMedico and mh.idEstado=1
            join horario h on mh.idHorario=h.idHorario and fechaHorario between DATE_ADD(date(now()),INTERVAL 1 DAY) and  DATE_ADD(date(now()),INTERVAL 14 DAY)
            where b.idEstado=1  order by 2";
    $rs = $conn->prepare($sql);
    $rs->bindParam(1, $dispensario);
    $rs->bindParam(2, $rowf['idTabla']);
    $rs->execute();
    $rowm = $rs->fetchAll(PDO::FETCH_ASSOC);
    $opcion = '';
    $p = 1;
    foreach ($rowm as $key => $value) {
        $opcion .= $eol . "👨‍🔬 *" . $p . ')* ' . $value['apenom'];
        $sql = "insert into chatOpcion (idChatMensaje,idChbSeleccion,numeral,idTabla,opcion) values(?,3,?,?,?)";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $usuario);
        $sen->bindParam(++$i, $p);
        $sen->bindParam(++$i, $value['idMedico']);
        $sen->bindParam(++$i, $value['apenom']);
        $sen->execute() or die(json_encode(array(0, 'Error al insertar')));
        $p++;
    }

    if (empty($opcion)) {
        $sql = "update chatMensaje set responseEspecialidad=null where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $usuario);
        $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al eliminar la especialidad')));
        return(json_encode(array('reply' => '🚫 No existen médicos con agenda libre en esa especialidad, escribe otra especialidad'.$eol . $eol . "o escribe *ATRAS* para regresar al menu anterior" . $eol . $eol . 'Si tienes problemas buscando horario escribe "asesor" o llama o escribe al +593984604041 para poder ayudarte.')));
    }
    $opcion .= $eol . $eol . "Escribe *ATRAS* para regresar al menu anterior";
    // MODIFICADO: Se ajusta la posición del icono
    return(json_encode(array('reply' => "Has seleccionado la especialidad: *" . $rowfe['descEspecialidad'] . '*' . $eol . " 🙂 Escribe el número en la lista, correspondiente al médico con el que quieres obtener tu cita: " . $eol . $opcion . "." . $eol . $eol . "⛔ O escribe *SALIR* para iniciar nuevamente el proceso")));
}
function getMedicos($conn,$idChatMensaje,$dispensario,$eol="\n"){
    $nomMedico = str_replace(array('.', 'doctor', 'dr', 'doctora', 'dra', 'lcdo', 'lcda', 'lic', 'licenciado', 'licenciada'), '', strtolower($_POST['message']));
    $aNom = explode(' ', strtoupper($nomMedico));

    // CORREGIDO: Consulta preparada para seguridad
    $sql = "select idTabla,opcion from chatOpcion where idChatMensaje=? and idChbSeleccion=3 and (numeral=? ";
    foreach ($aNom as $value) {
        $sql .= " or opcion like ? ";
    }
    $sql .= ")";
    $i = 0;
    $rs = $conn->prepare($sql);
    $rs->bindParam(++$i, $idChatMensaje);
    $rs->bindParam(++$i, $_POST['message']);
    foreach ($aNom as $value) {
        $likeTerm = "%" . trim($value) . "%";
        $rs->bindParam(++$i, $likeTerm);
    }
    $rs->execute();
    $res = $rs->rowCount();

    if ($res == 0) {
        return(json_encode(array('reply' => "🚫 Ese(a) médico no está en la lista." . $eol . "Escribe el número correspondiente al médico de la lista ⛔ o escribe *SALIR* para empezar otra vez")));
    }
    if ($res > 1) {
        return(json_encode(array('reply' => '🚫 El nombre coincide con mas de un médico en la lista, escribe un nombre mas específico o directamente el numero de opcion en a lista')));
    }
    $rowf = $rs->fetch(PDO::FETCH_ASSOC);

    $sql = "update chatMensaje set responseMedico=?,fechaRespuesta=now() where idChatMensaje=?";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $rowf['idTabla']);
    $sen->bindParam(++$i, $idChatMensaje);
    $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al guardar la respuesta del nombre del medico')));

    // LÓGICA CORREGIDA: Se añade "hm.idEstado=1" para buscar solo fechas con turnos disponibles
    $sql = "select distinct fechaHorario from horarioMedico hm
            join horario h on hm.idHorario=h.idHorario
            where idMedico=? and hm.idDispensario=? and hm.idEstado=1 and fechaHorario  between DATE_ADD(date(now()),INTERVAL 1 DAY) and  DATE_ADD(date(now()),INTERVAL 14 DAY) order by fechaHorario";
    $i = 0;
    $rs = $conn->prepare($sql);
    $rs->bindParam(++$i, $rowf['idTabla']);
    $rs->bindParam(++$i, $dispensario);
    $rs->execute();
    $rowj = $rs->fetchAll(PDO::FETCH_ASSOC);
    $opcion = '';
    $p = 1;
    foreach ($rowj as $key => $value) {
        $opcion .= $eol . "*" . $p . ')* ' . fechaLetras($value['fechaHorario'], true);
        $sql = "insert into chatOpcion (idChatMensaje,idChbSeleccion,numeral,idTabla,opcion) values(?,4,?,0,?)";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->bindParam(++$i, $p);
        $sen->bindParam(++$i, $value['fechaHorario']);
        $sen->execute() or die(json_encode(array(0, 'Error al insertar')));
        $p++;
    }

    if (empty($opcion)) {
        $sql = "update chatMensaje set responseMedico=null where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->execute() or die(json_encode(array('reply' => 'error al limpiar el nombre del medico')));
        return(json_encode(array('reply' => '🚫 No existen Fechas disponibles con el medico seleccionado, escribe el nombre de otro medico'.$eol . $eol . "Escribe *ATRAS* para regresar al menu anterior")));
    }
    $opcion .= $eol . $eol . "Escribe *ATRAS* para regresar al menu anterior";

    // MODIFICADO: Se ajusta la posición del icono
    return(json_encode(array('reply' => "Has seleccionado la cita con *Dr(a)." . $rowf['opcion'] . "*" . $eol . "🙂 Escribe el número que corresponde a la fecha en la lista en la que quieres obtener tu cita:     " . $eol . $opcion . $eol . $eol . "⛔ O escribe *SALIR* para iniciar nuevamente el proceso")));
}
function getFechas($conn,$idChatMensaje,$persona,$dispensario,$especialidad,$medico,$eol="\n"){
    // CORREGIDO: Consulta preparada para seguridad
    $sql = "select * from chatOpcion where idChatMensaje=? and idChbSeleccion=4 and (numeral=? or opcion = ?)";
    $i = 0;
    $rs = $conn->prepare($sql);
    $trimmed_message = trim($_POST['message']);
    $rs->bindParam(++$i, $idChatMensaje);
    $rs->bindParam(++$i, $_POST['message']);
    $rs->bindParam(++$i, $trimmed_message);
    $rs->execute();
    if (!$rowf = $rs->fetch(PDO::FETCH_ASSOC)) {
        return(json_encode(array('reply' => '🚫 Esa respuesta no existe en la base de datos, escribe una fecha tal como se muestra en la lista o selecciona el numero')));
    }

    // CORREGIDO: Se re-agrega el JOIN con la tabla 'horario' y se especifica 'h.fechaHorario'
    $sql = "select h.fechaHorario from personaHorMd ahm
    join persona a on ahm.idPersona=a.idPersona
    join horarioMedico hm on ahm.idHorarioMedico=hm.idHorarioMedico
    join horario h on hm.idHorario=h.idHorario
    where h.fechaHorario=? and a.idPersona=? and hm.idMedico=?";
    $rs = $conn->prepare($sql);
    $rs->bindParam(1, $rowf['opcion']);
    $rs->bindParam(2, $persona);
    $rs->bindParam(3, $medico);
    $rs->execute();
    if ($rowK = $rs->fetch(PDO::FETCH_ASSOC)) {
        $sql = "delete from chatMensaje where idPersona=? and idEstado=1";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $persona);
        $sen->execute() or die(json_encode(array('reply' => 'Error al Eliminar')));
        return(json_encode(array('reply' => '🚫 Ya tienes una cita fijada para ese día con ese mismo médico, lo sentimos'.$eol.$eol.'Selecciona una de las siguientes opciones'.$eol.'*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS' )));
    }

    // CORREGIDO: Se re-agrega el JOIN con la tabla 'horario' y se especifica 'h.fechaHorario'
    $sql = "select h.fechaHorario from personaHorMd ahm
    join persona a on ahm.idPersona=a.idPersona
    join horarioMedico hm on ahm.idHorarioMedico=hm.idHorarioMedico
    join medico m on hm.idMedico=m.idMedico
    join horario h on hm.idHorario=h.idHorario
    where h.fechaHorario=? and a.idPersona=? and hm.idMedico!=? and m.idEspecialidad=?";
    $rs = $conn->prepare($sql);
    $rs->bindParam(1, $rowf['opcion']);
    $rs->bindParam(2, $persona);
    $rs->bindParam(3, $medico);
    $rs->bindParam(4, $especialidad);
    $rs->execute();
    if ($rowK = $rs->fetch(PDO::FETCH_ASSOC)) {
        $sql = "delete from chatMensaje where idPersona=? and idEstado=1";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $persona);
        $sen->execute() or die(json_encode(array('reply' => 'Error al Eliminar')));
        return(json_encode(array('reply' => '🚫 Ya tienes una cita fijada para ese día con otro médico de la misma especialidad, lo sentimos'.$eol.$eol.'Selecciona una de las siguientes opciones'.$eol.'*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS' )));
    }

    $sql = "update chatMensaje set responseFecha=?,fechaRespuesta=now() where idChatMensaje=?";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $rowf['opcion']);
    $sen->bindParam(++$i, $idChatMensaje);
    $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al leer detalle')));

    $sql = "select idHorarioMedico,substr(hora,1,5) hora from horarioMedico hm join horario h on hm.idHorario=h.idHorario
            where idMedico=? and fechaHorario=? and hm.idDispensario=? and idEstado=1";
    $i = 0;
    $rs = $conn->prepare($sql);
    $rs->bindParam(++$i, $medico);
    $rs->bindParam(++$i, $rowf['opcion']);
    $rs->bindParam(++$i, $dispensario);
    $rs->execute();
    $rowj = $rs->fetchAll(PDO::FETCH_ASSOC);
    $opcion = '';
    $p = 1;
    foreach ($rowj as $key => $value) {
        $opcion .= "*" . $p . ')* 🕘' . $value["hora"] . $eol;
        $sql = "insert into chatOpcion (idChatMensaje,idChbSeleccion,numeral,idTabla,opcion) values(?,5,?,?,?)";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->bindParam(++$i, $p);
        $sen->bindParam(++$i, $value['idHorarioMedico']);
        $sen->bindParam(++$i, $value['hora']);
        $sen->execute() or die(json_encode(array(0, 'Error al insertar')));
        $p++;
    }

    if (empty($opcion)) {
        $sql = "update chatMensaje set responseFecha=null where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->execute() or die(json_encode(array('reply' => 'error al limpiar la fecha')));
        return(json_encode(array('reply' => '🚫 No existen Horarios la fecha seleccionada, selecciona otra fecha'.$eol . $eol . "o escribe *ATRAS* para regresar al menu anterior")));
    }
    $opcion .= $eol . $eol . "Escribe *ATRAS* para regresar al menu anterior";

    // MODIFICADO: Se ajusta la posición del icono
    return(json_encode(array('reply' => "Has seleccionado como fecha de tu cita el *" . (fechaLetras($rowf["opcion"])) . "* 🙂 " . $eol . "Escribe el número de la lista de Horarios, en la que quieres obtener tu cita:" . $eol . $eol . $opcion . "." . $eol . "⛔ O escribe *SALIR* para iniciar nuevamente el proceso")));
}
function getHorarios($conn,$idChatMensaje,$eol="\n"){
    // CORREGIDO: Consulta preparada para seguridad
    $sql = "select * from chatOpcion where idChatMensaje=? and idChbSeleccion=5 and (numeral=? or opcion = ?)";
    $i = 0;
    $rs = $conn->prepare($sql);
    $trimmed_message = trim($_POST['message']);
    $rs->bindParam(++$i, $idChatMensaje);
    $rs->bindParam(++$i, $_POST['message']);
    $rs->bindParam(++$i, $trimmed_message);
    $rs->execute();
    if (!$rowf = $rs->fetch(PDO::FETCH_ASSOC)) {
        return(json_encode(array('reply' => "🚫 Esa respuesta no existe en la base de datos." . $eol . "Escribe el número en la lista de la hora que quieres escoger para tu cita. ⛔ O escribe *SALIR* para empezar de nuevo")));
    }

    $sql = "update chatMensaje set responseHora=?,fechaRespuesta=now() where idChatMensaje=?";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $rowf['opcion']);
    $sen->bindParam(++$i, $idChatMensaje);
    $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al leer detalle')));

    $sql = "select a.*,concat(p.nombres,' ',p.apellidos) paciente,concat(pu.nombres,' ',pu.apellidos) medico,descDispensario,descEspecialidad,fechaHorario,hora
            from chatMensaje a
            join persona p on a.idPersona=p.idPersona
            join dispensario d on a.responseDispensario=d.idDispensario
            join especialidad e on a.responseEspecialidad=e.idEspecialidad
            join medico m on responseMedico=m.idMedico
            join usuario ur on m.idUsuario=ur.idUsuario
            join persona pu on ur.idpersona=pu.idPersona
            join horarioMedico hm on m.idMedico=hm.idMedico
            join horario h on hm.idHorario=h.idHorario and fechaHorario=responseFecha and substr(hora,1,5)=responseHora
            where idChatMensaje=?";
    $i = 0;
    $rs = $conn->prepare($sql);
    $rs->bindParam(++$i, $idChatMensaje);
    $rs->execute();
    $opcion = '';
    if ($row = $rs->fetch(PDO::FETCH_ASSOC)) {
        $opcion = "👍 Excelente estás listo(a) para terminar el proceso!!!." . $eol . "🙂 Estás seguro(a) que quieres tomar una cita para el:" . $eol . "*" . (fechaLetras($row["fechaHorario"])) . "* a las *" . (substr($row["hora"], 0, 5)) . " horas* " . $eol . "En el *" . $row["descDispensario"] . "*." . $eol . "Especialidad de *" . $row["descEspecialidad"] . "* " . $eol . "Con el(a) *Dr." . $row["medico"] . "*???." . $eol . $eol . "Para confirmar escribe  *SI* 🟢" . $eol .  "Caso contrario escribe *NO* 🔴".$eol . $eol . "o escribe *ATRAS* para regresar al menu anterior";
    }

    return(json_encode(array('reply' => $opcion)));
}
function getCitaFinal($conn,$idChatMensaje,$persona,$dispensario,$especialidad,$medico,$fecha,$hora,$realIP,$eol="\n"){
    $sql = "update chatMensaje set responseConfirma=?,fechaRespuesta=now() where idChatMensaje=?";
    $i = 0;
    $sen = $conn->prepare($sql);
    $sen->bindParam(++$i, $_POST['message']);
    $sen->bindParam(++$i, $idChatMensaje);
    $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al leer detalle')));

    if (strtolower(substr($_POST['message'], 0, 2)) != 'si') {
        $sql = "delete from chatMensaje where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->execute() or die(json_encode(array(0, 'Error al Eliminar')));
        return(json_encode(array('reply' => '🔴 Proceso cancelado, si quieres iniciar nuevamente escribe el número de una de las siguientes opciones:' . $eol . '*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS')));
    }

    $sql = "select u.idUsuario from chatMensaje t join usuario u on t.idPersona=u.idPersona where idChatMensaje=?";
    $i = 0;
    $rs = $conn->prepare($sql);
    $rs->bindParam(++$i, $idChatMensaje);
    $rs->execute();
    $us = NULL;
    if ($rowUS = $rs->fetch(PDO::FETCH_ASSOC)) {
        $us = $rowUS['idUsuario'];
    }

    $sql = "select idHorarioMedico from horarioMedico hm join horario h on hm.idHorario=h.idHorario where idMedico=? and fechaHorario=? and hora=? and hm.idEstado=1";
    $i = 0;
    $rs = $conn->prepare($sql);
    $rs->bindParam(++$i, $medico);
    $rs->bindParam(++$i, $fecha);
    $rs->bindParam(++$i, $hora);
    $rs->execute();
    if ($rowX = $rs->fetch(PDO::FETCH_ASSOC)) {

        $sql = "delete from chatOpcion where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->execute() or die(json_encode(array(0, 'Error al Eliminar')));

        $sql = "update chatMensaje set idEstado=2 where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->execute() or die(json_encode(array('reply' => 'Error al actualizar')));

        $sql = "insert into personaHorMd (idHorarioMedico,idPersona,idCausaConsulta,idDispensario,idEspecialidad,confirmado,fechaConfirmacion,medioConfirmacion,fechaGenerada,ip,idUsuarioGenera) values(?,?,1,?,?,'S',now(),'CHB',now(),?,?)";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $rowX['idHorarioMedico']);
        $sen->bindParam(++$i, $persona);
        $sen->bindParam(++$i, $dispensario);
        $sen->bindParam(++$i, $especialidad);
        $sen->bindParam(++$i, $realIP);
        $sen->bindParam(++$i, $us);
        $sen->execute() or die(json_encode(array('reply' => 'Error al insertar', 'fin' => 'no')));

        $sql = "update horarioMedico set idEstado=2 where idHorarioMedico=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $rowX['idHorarioMedico']);
        $sen->execute() or die(json_encode(array('reply' => 'Error al actualizar', 'fin' => 'no')));
    } else {
        $sql = "update chatMensaje set responseHora=null,fechaRespuesta=now(),responseConfirma=null where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->execute() or die(json_encode(array('reply' => 'Error en el servidor al leer detalle')));


        return(json_encode(array('reply' => "🔴 Lo sentimos, el horario que seleccionaste ya ha sido tomado por otro(a) paciente" . $eol . "Selecciona otro horario de la lista, ⛔ o escribe *SALIR* para empezar de nuevo")));
    }


    return(json_encode(array('reply' => "👍 *Proceso Finalizado* ✅ tu cita ha sido confirmada; recuerda asistir con al menos 20 minutos de anticipación, portando tu cédula de identidad." . $eol . "➡️ Puedes ingresar al https://medicalcare.ec/intranet con tu usuario y contraseña para consultar y administrar tus citas")));
}
function getPasadas($conn,$message,$idChatMensaje,$eol="\n"){
    $sqlOld = "select idPersonaHorMd, ahm.idHorarioMedico, ahm.idPersona, confirmado, fechaConfirmacion,
        medioConfirmacion,fechaHorario,substr(hora,1,5) hora,concat_ws(' ',SUBSTRING_INDEX(codigoProfesional,',',-1),
        agm.apellidos,agm.nombres,'-',descEspecialidad) medico,concat_ws(' ',ag.apellidos,ag.nombres) paciente,descDispensario,descEspecialidad
        from personaHorMd ahm
        join persona ag on ahm.idPersona=ag.idPersona
        join horarioMedico hm on ahm.idHorarioMedico=hm.idHorarioMedico
        join horario h on hm.idHorario=h.idHorario
        join medico m on hm.idMedico=m.idMedico
        join usuario um on  m.idUsuario=um.idUsuario
        join persona agm on um.idPersona=agm.idPersona
        join especialidad e on m.idEspecialidad=e.idEspecialidad
        join dispensario d  on ahm.idDispensario=d.idDispensario
        where ag.cedula=? and fechaHorario<date(now()) order by fechaHorario desc,hora desc";
        $i = 0;
        $rs = $conn->prepare($sqlOld);
        $rs->bindParam(++$i, $message);
        $rs->execute();
        $rowf = $rs->fetchAll(PDO::FETCH_ASSOC);
        $opcion = '';
        $k = 0;
        foreach ($rowf as $key => $value) {
            $opcion .= '✅ ' . (++$k) . '. En ' . $value['descDispensario'] . ' el ' . (fechaLetras($value['fechaHorario'])) . ' a las ' . $value['hora'] . ' Horas, con ' . $value['medico'] . $eol.$eol;
        }
        $sql = "update chatMensaje set idEstado=2 where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->execute() or die(json_encode(array('reply' => 'Error al actualizar')));
        if (!empty($opcion)) {
            return(json_encode(array('reply' => '*CITAS PASADAS:* '.$eol . $opcion . $eol . ' *Escribe* ' . $eol . '*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS')));
        }
        return(json_encode(array('reply' => '🚫 No tiene citas anteriores' . $eol . $eol . ' *Escribe* ' . $eol . '*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS')));
}
function getFuturas($conn,$message,$idChatMensaje,$eol="\n"){
    $sqlOld = "select idPersonaHorMd, ahm.idHorarioMedico, ahm.idPersona, confirmado, fechaConfirmacion,
        medioConfirmacion,fechaHorario,substr(hora,1,5) hora,concat_ws(' ',SUBSTRING_INDEX(codigoProfesional,',',-1),
        agm.apellidos,agm.nombres,'-',descEspecialidad) medico,concat_ws(' ',ag.apellidos,ag.nombres) paciente,descDispensario,descEspecialidad
        from personaHorMd ahm
        join persona ag on ahm.idPersona=ag.idPersona
        join horarioMedico hm on ahm.idHorarioMedico=hm.idHorarioMedico
        join horario h on hm.idHorario=h.idHorario
        join medico m on hm.idMedico=m.idMedico
        join usuario um on  m.idUsuario=um.idUsuario
        join persona agm on um.idPersona=agm.idPersona
        join especialidad e on m.idEspecialidad=e.idEspecialidad
        join dispensario d  on ahm.idDispensario=d.idDispensario
        where ag.cedula=? and fechaHorario>=date(now()) order by fechaHorario desc,hora desc";
        $i = 0;
        $rs = $conn->prepare($sqlOld);
        $rs->bindParam(++$i, $message);
        $rs->execute();
        $rowf = $rs->fetchAll(PDO::FETCH_ASSOC);
        $opcion = '';
        $k = 0;
        foreach ($rowf as $key => $value) {
            $opcion .= '✅ ' . (++$k) . '. En ' . $value['descDispensario'] . ' el ' . (fechaLetras($value['fechaHorario'])) . ' a las ' . $value['hora'] . ' Horas, con ' . $value['medico'] . $eol;
        }
        $sql = "update chatMensaje set idEstado=2 where idChatMensaje=?";
        $i = 0;
        $sen = $conn->prepare($sql);
        $sen->bindParam(++$i, $idChatMensaje);
        $sen->execute() or die(json_encode(array('reply' => 'Error al actualizar')));
        if (!empty($opcion)) {
            return(json_encode(array('reply' => '*CITAS PLANIFICADAS:* '.$eol . $opcion . $eol . ' *Escribe* ' . $eol . '*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS')));
        }
        return(json_encode(array('reply' => '🚫 No tiene citas planificadas a futuro' . $eol . $eol . ' *Escribe* ' . $eol . '*1.* CITA' . $eol . '*2.* MIS CITAS PROGRAMADAS' . $eol . '*3.* MIS CITAS PASADAS')));
}
/** FIN FUNCIONES */


/** INICIO DEL PROGRAMA */
/** Inicia el flujo  buscando si ya existe un holo abierto desde ese numero telefonico en los ultimos 20min*/

$sqlMain = "select * from chatMensaje a
    where phone=? and fechaInicio >=NOW() - INTERVAL 20 MINUTE  and idEstado=1 ";
//echo $sqlMain;
$i = 0;
$rs = $conn->prepare($sqlMain);
$rs->bindParam(++$i, $_POST['phone']);
$rs->execute();

/** Si el resultado de la consulta es vacio, crea un registro un nuevo hilo en la tabla chatMensaje
 * con el numero telefonico y envia la respuesta de bienvenida y le pide el numero de cedula*/
if (!$row = $rs->fetch(PDO::FETCH_ASSOC)){
    die(newThread($conn,$_POST['message']));
}

/** El hilo ya existe entonces trae los datos que identifican la conversacion en la base de datos */
$usuario = $row['idChatMensaje'];
$tipoConsulta = $row['tipoConsulta'];
$pacienteISSFA = 'N';

/** Control que revisa si el usuario envia el mensaje ATRAS para regresar al  paso anterior
 * Este proceso solamente se ejecutará si el usuario ya seleccionó el dispensario
 * y envia mensaje atras
 * entra a ejecutar la funcion goBack */
$agoBack = array('ATRAS', 'atras', 'Atras', 'atrás', 'ATRÁS', 'Atrás', 'atraz');
if (in_array($_POST['message'], $agoBack) and !empty($row['responseDispensario'])) {
    $_POST['message'] = goBack($conn, $row);
    /** Luego del goback es necesario volver a actualizar los datos del estado del hilo para capturar
     * la informacion anterior volviendo a realizar la consulta $sqlMain
     */
    $i = 0;
    $rs = $conn->prepare($sqlMain);
    $rs->bindParam(++$i, $_POST['phone']);
    $rs->execute();
    $row = $rs->fetch(PDO::FETCH_ASSOC);
}

/** Si el usuario envia el mensaje para salir y reniciar el hilo */
$aCancel = array('cancelar', 'cancel', 'cancela', 'salir');
if (in_array(strtolower($_POST['message']), $aCancel)) {
    die(restartThread($conn,$row['idChatMensaje']));
}



/** De acuerdo a la opcion de servicio requerido que ha escogido el usuario,  1 Citas, 2 Citas futuras, 3 Citas pasadas
 * en este paso el usuario ha enviado el numero de cedula, y de acuerdo a ese dato se procesa la opcion correspondiente
 */
if (empty($row['responseCedula'])) {
    switch ($row['tipoConsulta']) {
        case 3:
            # PASADAS
            die(getPasadas($conn,$_POST['message'],$row['idChatMensaje']));
            break;
        case 2:
            # FUTURAS
            die(getFuturas($conn,$_POST['message'],$row['idChatMensaje']));
            break;

        default:
            die(getPatient($conn,$_POST['message'],$row['idChatMensaje']));
            break;
    }
}

/** El hilo está en el paso en que el ya identifico al usuario por su numero de cedula
 * entonces le enviamos la lista de dispensarios */
if (empty($row['responseDispensario'])) {
    die(getDispensarios($conn,$row['idChatMensaje']));
}

/** El hilo está en el paso en que escogió el dispensario y le enviamos la lista
 * de especialidades de ese dispensario
 */
if (empty($row['responseEspecialidad'])) {
    die(getEspecialidades($conn,$row['idChatMensaje'],$pacienteISSFA,$row['idPersona'],$row['responseDispensario']));
}

/** El hilo está en el paso en que seleccionó la especialidad y le enviamos la lista
 * de médicos de esa especialidad (solamente los que tienen fechas disponibles en su agenda en los próximos 7 dias)
 */
if (empty($row['responseMedico'])) {
    die(getMedicos($conn,$row['idChatMensaje'],$row['responseDispensario']));
}
/** El hilo está en el paso en que ha seleccionado al médico y le enviamos las lista de
 * fechas disponibles de ese médico en los proximos 7 dias
*/
if (empty($row['responseFecha'])) {
    die(getFechas($conn,$row['idChatMensaje'],$row['idPersona'],$row['responseDispensario'],$row['responseEspecialidad'],$row['responseMedico']));
}
/** El hilo está en el paso en que ha seleccionado la fecha y le enviamos la lista
 * de horarios disponibles en la fecha escogida
 */
if (empty($row['responseHora'])) {
    die(getHorarios($conn,$row['idChatMensaje']));
}
/** El hilo está en el ultimo paso donde ha escogido la hora de la cita y el usuario
 * debe confirmar o cancelar
 * dependiendo de la respuesta se guardará la cita o se eliminará todo el hilo
 * Fin del proceso
 */
if (empty($row['responseConfirma'])) {
    die(getCitaFinal($conn,$row['idChatMensaje'],$row['idPersona'],$row['responseDispensario'],$row['responseEspecialidad'],$row['responseMedico'],$row['responseFecha'],$row['responseHora'],$realIP));
}
/** No ha ingresado por ninguna de las opciones */
die(json_encode(array('reply' => '🔴 Error no existe esa opción')));
?>
