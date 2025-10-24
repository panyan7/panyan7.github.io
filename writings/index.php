<?php
// Simple PHP script to list all .md files in the blogs directory
// This provides a JSON API endpoint for the JavaScript to discover blog files

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$blogsDir = __DIR__;
$files = [];

// Scan the directory for .md files
if (is_dir($blogsDir)) {
    $items = scandir($blogsDir);
    foreach ($items as $item) {
        if ($item !== '.' && $item !== '..' && pathinfo($item, PATHINFO_EXTENSION) === 'md') {
            $files[] = $item;
        }
    }
}

// Sort files alphabetically (you can change this to sort by date if needed)
sort($files);

// Return JSON response
echo json_encode([
    'files' => $files,
    'count' => count($files),
    'generated' => date('c')
]);
?>
