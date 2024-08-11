<?php
// Включение отображения ошибок для отладки
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    // Запускаем JS скрипт и логируем ошибки
    $command = 'node scrape_reviews_yandex.js 2>&1';
    $output = shell_exec($command);
    
    // Логируем вывод и ошибки
    error_log("Вывод скрипта: " . $output);
    
    if ($output === null) {
        throw new Exception('Не удалось выполнить JS скрипт.');
    }

    // Проверяем наличие JSON файлов
    if (!file_exists('reviews2.json') || !file_exists('parse_2GIS.json')) {
        throw new Exception('Один или несколько файлов JSON с отзывами не найдены.');
    }

    // Читаем JSON файлы
    $jsonYandexData = file_get_contents('reviews2.json');
    $json2GISData = file_get_contents('parse_2GIS.json');
    
    // Декодируем JSON данные
    $dataYandex = json_decode($jsonYandexData, true);
    $data2GIS = json_decode($json2GISData, true);

    // Проверяем, что данные декодировались корректно
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Ошибка декодирования JSON: ' . json_last_error_msg());
    }

    // Логируем декодированные данные
    error_log("Yandex Reviews: " . print_r($dataYandex, true));
    error_log("2GIS Data: " . print_r($data2GIS, true));

    // Приводим данные к единообразному виду
    $yandexReviews = array_map(function($review) {
        return [
            'author' => $review['author'] ?? 'Неизвестный автор',
            'date' => $review['date'] ?? 'Дата отсутствует',
            'rating' => $review['rating'] ?? 'Без рейтинга',
            'reviewText' => $review['text'] ?? 'Текст отсутствует',
            'platform' => $review['platform'] ?? 'Неизвестно'
        ];
    }, $dataYandex['reviews'] ?? []);
    
    $twoGISReviews = array_map(function($review) {
        return [
            'author' => $review['author'] ?? 'Неизвестный автор',
            'date' => $review['date'] ?? 'Дата отсутствует',
            'rating' => $review['rating'] ?? 'Без рейтинга',
            'reviewText' => $review['reviewText'] ?? 'Текст отсутствует',
            'platform' => $review['platform'] ?? 'Неизвестно'
        ];
    }, $data2GIS['reviews'] ?? []);

    // Объединяем данные
    $mergedData = [
        'yandexReviews' => $yandexReviews,
        '2gisReviews' => $twoGISReviews,
        'averageRatingYandex' => $dataYandex['averageRatings']['Яндекс Карты'] ?? null,
        'averageRating2GIS' => $data2GIS['averageRating2GIS'] ?? null,
        'averageRatingGoogle' => $dataYandex['averageRatings']['Google Maps'] ?? null
    ];

    // Возврат объединенных данных в формате JSON
    echo json_encode($mergedData, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    // Логируем и возвращаем ошибку
    error_log($e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>
