<?php
// Включение отображения ошибок для отладки
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    // Укажите URL страницы с отзывами на Яндекс Картах
    $url = 'https://yandex.ru/maps/org/daymond_klinik/164798670887/reviews/?indoorLevel=1&ll=49.123700%2C55.790012&z=16';

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
    $reviewNodes = $xpath->query("//div[contains(@class, 'business-review-view__info')]");

    if ($reviewNodes === FALSE) {
        throw new Exception('Ошибка при парсинге');
    }

    foreach ($reviewNodes as $node) {
        $author = $xpath->query(".//div[contains(@class, 'business-review-view__author-name')]/a/span", $node)->item(0)->textContent ?? 'Неизвестный автор';
        $date = $xpath->query(".//span[contains(@class, 'business-review-view__date')]", $node)->item(0)->textContent ?? 'Дата отсутствует';
        $rating = $xpath->query(".//div[contains(@class, 'business-review-view__rating')]/div/meta[@itemprop='ratingValue']", $node)->item(0)->getAttribute('content') ?? 'Без рейтинга';
        $reviewText = $xpath->query(".//div[contains(@class, 'business-review-view__body')]/span/span", $node)->item(0)->textContent ?? 'Текст отсутствует';

        $reviews[] = [
            'author' => trim($author),
            'date' => trim($date),
            'rating' => (int)$rating,  // Приведение к числу
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
