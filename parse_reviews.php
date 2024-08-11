<?php
// Укажите URL страницы с отзывами на 2ГИС
$url = 'https://2gis.ru/n_novgorod/inside/2674647933966364/firm/70000001021080960/tab/reviews?m=43.999939%2C56.311007%2F16%2Fp%2F0.3';

// Получение HTML-кода страницы
$html = file_get_contents($url);

if ($html === FALSE) {
    echo json_encode(['error' => 'Не удалось загрузить страницу']);
    exit;
}

// Создание объекта DOMDocument
$dom = new DOMDocument();
@$dom->loadHTML($html);

// Создание объекта XPath для удобного парсинга
$xpath = new DOMXPath($dom);

// Парсинг отзывов
$reviews = [];
$reviewNodes = $xpath->query("//div[contains(@class, '_11gvyqv')]");

foreach ($reviewNodes as $node) {
    $author = $xpath->query(".//span[@class='_16s5yj36']", $node)->item(0)->textContent ?? 'Неизвестный автор';
    $date = $xpath->query(".//div[@class='_4mwq3d']", $node)->item(0)->textContent ?? 'Дата отсутствует';
    $rating = $xpath->query(".//div[@class='_1fkin5c']/span", $node)->length ?? 'Без рейтинга';
    $reviewText = $xpath->query(".//a[@class='_ayej9u3']", $node)->item(0)->textContent ?? 'Текст отсутствует';


    $reviews[] = [
        'author' => trim($author),
        'date' => trim($date),
        'rating' => $rating,
        'reviewText' => trim($reviewText),

    ];
}

// Возврат данных в формате JSON
header('Content-Type: application/json');
echo json_encode($reviews);
