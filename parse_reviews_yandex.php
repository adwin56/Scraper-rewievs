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
        $authorNode = $xpath->query(".//div[contains(@class, 'business-review-view__author-name')]/a/span", $node)->item(0);
        $author = $authorNode ? $authorNode->textContent : 'Неизвестный автор';

        $dateNode = $xpath->query(".//span[contains(@class, 'business-review-view__date')]", $node)->item(0);
        $date = $dateNode ? $dateNode->textContent : 'Дата отсутствует';

        // Подсчет количества звезд для получения рейтинга
        $ratingStars = $xpath->query(".//div[contains(@class, 'business-rating-badge-view__stars')]/span[contains(@class, 'business-rating-badge-view__star')]", $node);
        $rating = $ratingStars ? $ratingStars->length : 'Без рейтинга';

        // Исправленный XPath для парсинга текста отзыва
        $reviewTextNode = $xpath->query(".//div[contains(@class, 'spoiler-view__text')]//span[@class='business-review-view__body-text']", $node)->item(0);
        $reviewText = $reviewTextNode ? $reviewTextNode->textContent : 'Текст отсутствует';

        $reviews[] = [
            'author' => trim($author),
            'date' => trim($date),
            'rating' => (int)$rating,
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
