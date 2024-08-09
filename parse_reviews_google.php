<?php
// Включение отображения ошибок для отладки
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    // Укажите URL страницы с отзывами на Google Maps
    $url = 'https://www.google.ru/maps/place/Стоматологическая+клиника+Даймонд-Клиник+Горьковская+Ӏ+имплантация+зубов,+виниры/@56.3109185,43.99761,17z/data=!4m8!3m7!1s0x4151d5ed4c477dbb:0xa76f684cc157f9b7!8m2!3d56.3110243!4d44.0001199!9m1!1b1!16s%2Fg%2F11bzrhpp3j?entry=ttu';

    // Получение HTML-кода страницы
    $html = file_get_contents($url);

    if ($html === FALSE) {
        throw new Exception('Не удалось загрузить страницу');
    }

    // Создание объекта DOMDocument
    $dom = new DOMDocument();
    @$dom->loadHTML($html);

    // Создание объекта XPath для удобного парсинга
    $xpath = new DOMXPath($dom);

    // Парсинг отзывов
    $reviews = [];
    $reviewNodes = $xpath->query("//div[contains(@class, 'jftiEf')]");

    if ($reviewNodes === FALSE) {
        throw new Exception('Ошибка при парсинге');
    }

    foreach ($reviewNodes as $node) {
        // Парсинг автора отзыва
        $authorNode = $xpath->query(".//div[@class='d4r55 ']", $node)->item(0);
        $author = $authorNode ? $authorNode->textContent : 'Неизвестный автор';

        // Парсинг даты отзыва
        $dateNode = $xpath->query(".//span[contains(@class, 'rsqaWe')]", $node)->item(0);
        $date = $dateNode ? $dateNode->textContent : 'Дата отсутствует';

        // Парсинг рейтинга отзыва (количество звезд)
        $ratingNode = $xpath->query(".//span[@class='kvMYJc' and @role='img']", $node)->item(0);
        $rating = $ratingNode ? (int)filter_var($ratingNode->getAttribute('aria-label'), FILTER_SANITIZE_NUMBER_INT) : 'Без рейтинга';

        // Парсинг текста отзыва
        $reviewTextNode = $xpath->query(".//span[@class='wiI7pd']", $node)->item(0);
        $reviewText = $reviewTextNode ? $reviewTextNode->textContent : 'Текст отсутствует';

        $reviews[] = [
            'author' => trim($author),
            'date' => trim($date),
            'rating' => $rating,
            'reviewText' => trim($reviewText)
        ];
    }

    // Логирование JSON-данных перед отправкой
    $jsonReviews = json_encode($reviews);
    error_log("Отправляемые данные JSON: " . $jsonReviews);

    echo $jsonReviews;

} catch (Exception $e) {
    // Логирование ошибки в лог сервера
    error_log($e->getMessage());
    // Возврат ошибки в формате JSON
    echo json_encode(['error' => $e->getMessage()]);
}
?>
