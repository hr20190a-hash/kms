<?php
require_once 'config.php';
try {
    $pdo = getDbConnection();
    $stmt = $pdo->query("SELECT * FROM yield_tests ORDER BY date DESC");
    $tests = $stmt->fetchAll();
    $processed_tests = array_map(function($test) {
        $test['grossWeightKg'] = (float) $test['grossWeightKg'];
        $test['netWeightKg'] = (float) $test['netWeightKg'];
        $test['wasteWeightKg'] = (float) $test['wasteWeightKg'];
        $test['yieldPercentage'] = (float) $test['yieldPercentage'];
        $test['correctionFactor'] = (float) $test['correctionFactor'];
        $test['costPerKgGross'] = (float) $test['costPerKgGross'];
        $test['realCostPerKgNet'] = (float) $test['realCostPerKgNet'];
        return $test;
    }, $tests);
    echo json_encode($processed_tests);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
}
?>
