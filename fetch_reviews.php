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

    // Ссылки на платформы
    $platformLinks = [
        'Яндекс Карты' => 'https://yandex.ru/maps/org/daymond_klinik/164798670887/reviews/?indoorLevel=1&ll=49.123700%2C55.790012&z=16',
        'Google Maps' => 'https://www.google.ru/maps/place/Стоматологическая+клиника+Даймонд-Клиника+Горьковская+Ӏ+имплантация+зубов,+виниры/@56.3109185,43.99761,17z/data=!4m8!3m7!1s0x4151d5ed4c477dbb:0xa76f684cc157f9b7!8m2!3d56.3110243!4d44.0001199!9m1!1b1!16s%2Fg%2F11bzrhpp3j?entry=ttu',
        '2ГИС' => 'https://2gis.ru/n_novgorod/inside/2674647933966364/firm/70000001021080960/tab/reviews?m=43.999939%2C56.311007%2F16%2Fp%2F0.3'
    ];

    // Приводим данные к единообразному виду
    $yandexReviews = array_map(function($review) use ($platformLinks) {
        $platform = $review['platform'] ?? 'Неизвестно';
        $avatarUrl = trim($review['avatarUrl'], '\"/');
        return [
            'author' => $review['author'] ?? 'Неизвестный автор',
            'date' => $review['date'] ?? 'Дата отсутствует',
            'rating' => $review['rating'] ?? 'Без рейтинга',
            'reviewText' => $review['text'] ?? 'Текст отсутствует',
            'avatarUrl' => $avatarUrl,
            'platform' => $platform,
            'platformUrl' => $platformLinks[$platform] ?? 'Неизвестная платформа'
        ];
    }, $dataYandex['reviews'] ?? []);
    
    $twoGISReviews = array_map(function($review) use ($platformLinks) {
        $avatarUrl = trim($review['avatarUrl'], '\"/');
        return [
            'author' => $review['author'] ?? 'Неизвестный автор',
            'date' => $review['date'] ?? 'Дата отсутствует',
            'rating' => $review['rating'] ?? 'Без рейтинга',
            'reviewText' => $review['reviewText'] ?? 'Текст отсутствует',
            'avatarUrl' => $avatarUrl,
            'platform' => '2ГИС',
            'platformUrl' => $platformLinks['2ГИС']
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
