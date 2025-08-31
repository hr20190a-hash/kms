<?php
require_once 'config.php';

// Solo permitir peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Obtener el cuerpo de la petición
$json_payload = file_get_contents('php://input');
$request_data = json_decode($json_payload, true);

if (json_last_error() !== JSON_ERROR_NONE || !isset($request_data['action']) || !isset($request_data['payload'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

$action = $request_data['action'];
$payload = $request_data['payload'];
$api_key = GEMINI_API_KEY;
$model = 'gemini-1.5-flash'; // O el modelo que prefieras

// --- Lógica para cada acción ---
// Aquí es donde construirías la petición específica para cada caso de uso.
// Esta es una implementación simplificada.
// En una app real, cada `case` tendría una construcción de `prompt` y `schema` más detallada.

$prompt = "";
$json_schema = new stdClass(); // Objeto vacío por defecto

switch ($action) {
    case 'generateRecipe':
        // Lógica para construir el prompt de generar receta...
        $prompt = "Crea una receta de cocina profesional con los siguientes ingredientes: " . $payload['ingredients'] . ". La receta debe ser adecuada para un hotel de lujo. Incluye nombre, descripción, porciones, tiempos, ingredientes (con cantidad y unidad), pasos y etiquetas.";
        // Aquí definirías el schema JSON que esperas de la API de Gemini
        break;
    
    // ... otros cases para 'analyzeAllergens', 'convertToVegetarian', etc.

    default:
        http_response_code(400);
        echo json_encode(['error' => "Unknown action: {$action}"]);
        exit;
}


// --- Llamada a la API de Gemini ---
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$api_key}";

$data = [
    'contents' => [
        [
            'parts' => [
                ['text' => $prompt]
            ]
        ]
    ],
    // 'generationConfig' => [ ... ] // Si necesitas configurar temperatura, etc.
];

// Si tienes un schema, lo añades a la configuración
// if (!empty((array)$json_schema)) {
//     $data['generationConfig']['response_mime_type'] = 'application/json';
//     $data['generationConfig']['response_schema'] = $json_schema;
// }


$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL Error: ' . curl_error($ch)]);
    exit;
}

curl_close($ch);

if ($http_code >= 400) {
    http_response_code($http_code);
    // Intenta decodificar la respuesta de error de Google
    $error_details = json_decode($response, true);
    if ($error_details && isset($error_details['error']['message'])) {
       echo json_encode(['error' => "Google API Error: " . $error_details['error']['message']]);
    } else {
       echo json_encode(['error' => "Google API returned status {$http_code}", 'details' => $response]);
    }
    exit;
}

// --- Procesar y devolver la respuesta ---
$result = json_decode($response, true);
$text_content = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

// Intentar decodificar el texto si se espera un JSON
$recipe_data = json_decode($text_content, true);

if (json_last_error() === JSON_ERROR_NONE) {
    echo json_encode(['data' => $recipe_data]);
} else {
    // Si la respuesta no es un JSON válido (o no se esperaba que lo fuera)
    // Devolvemos el texto plano dentro de una estructura JSON
    http_response_code(500);
    echo json_encode(['error' => 'La respuesta de la IA no es un JSON válido.', 'raw_response' => $text_content]);
}

?>
