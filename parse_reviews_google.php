<?php
// Включение отображения ошибок для отладки
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    $url = 'https://www.google.ru/maps/place/Стоматологическая+клиника+Даймонд-Клиника+Горьковская+Ӏ+имплантация+зубов,+виниры/@56.3109185,43.99761,17z/data=!4m8!3m7!1s0x4151d5ed4c477dbb:0xa76f684cc157f9b7!8m2!3d56.3110243!4d44.0001199!9m1!1b1!16s%2Fg%2F11bzrhpp3j?entry=ttu'; // Ваша ссылка

    // Использование cURL для загрузки страницы
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    $html = curl_exec($ch);
    curl_close($ch);

    if ($html === FALSE) {
        throw new Exception('Не удалось загрузить страницу');
    }
    
    $dom = new DOMDocument();
    @$dom->loadHTML($html);
    $xpath = new DOMXPath($dom);

    $logs = [];
    $logs[] = 'HTML загружен успешно';
    $logs[] = 'HTML успешно загружен в DOMDocument';
    $logs[] = 'Объект DOMXPath успешно создан';

    // Измените XPath-запрос для поиска элементов отзывов
    $reviewNodes = $xpath->query('//*[contains(concat( " ", @class, " " ), concat( " ", ".jftiEf.fontBodyMedium", " " ))]');


    if ($reviewNodes === FALSE) {
        throw new Exception('Ошибка при парсинге: не удалось найти элементы отзывов');
    }

    $logs[] = 'Найдено ' . $reviewNodes->length . ' элементов отзывов';

    $reviews = [];
    foreach ($reviewNodes as $node) {
        // Поиск элементов внутри отзыва
        $authorNode = $xpath->query(".//div[contains(@class, 'd4r55')]", $node)->item(0);
        $author = $authorNode ? $authorNode->textContent : 'Неизвестный автор';
        $logs[] = 'Автор: ' . $author;

        $dateNode = $xpath->query(".//span[contains(@class, 'rsqaWe')]", $node)->item(0);
        $date = $dateNode ? $dateNode->textContent : 'Дата отсутствует';
        $logs[] = 'Дата: ' . $date;

        $ratingStars = $xpath->query(".//span[contains(@class, 'hCCjke') and contains(@class, 'elGi1d')]", $node);
        $rating = $ratingStars ? $ratingStars->length : 'Без рейтинга';
        $logs[] = 'Рейтинг: ' . $rating;

        $reviewTextNode = $xpath->query(".//span[contains(@class, 'wiI7pd')]", $node)->item(0);
        $reviewText = $reviewTextNode ? $reviewTextNode->textContent : 'Текст отсутствует';
        $logs[] = 'Текст отзыва: ' . $reviewText;

        $reviews[] = [
            'author' => trim($author),
            'date' => trim($date),
            'rating' => (int)$rating,
            'reviewText' => trim($reviewText)
        ];
    }

    $jsonReviews = json_encode(['reviews' => $reviews, 'logs' => $logs]);
    echo $jsonReviews;

} catch (Exception $e) {
    $logs[] = 'Ошибка: ' . $e->getMessage();
    echo json_encode(['error' => $e->getMessage(), 'logs' => $logs]);
}
