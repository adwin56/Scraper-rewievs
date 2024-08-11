<?php
// Включение отображения ошибок для отладки
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    // Запускаем JS скрипт
    $output = shell_exec('node scrape_reviews_yandex.js');
    
    if ($output === null) {
        throw new Exception('Не удалось выполнить JS скрипт.');
    }

    // Проверяем наличие JSON файла
    if (!file_exists('reviews2.json')) {
        throw new Exception('Файл JSON с отзывами не найден.');
    }

    // Читаем JSON файл
    $jsonData = file_get_contents('reviews.json');
    echo $jsonData;
} catch (Exception $e) {
    // Логируем и возвращаем ошибку
    error_log($e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>
