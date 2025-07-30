<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dataFile = 'links.json';

// Create empty file if it doesn't exist
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
}

// Load existing links
function loadLinks() {
    global $dataFile;
    $content = file_get_contents($dataFile);
    return json_decode($content, true) ?: [];
}

// Save links
function saveLinks($links) {
    global $dataFile;
    return file_put_contents($dataFile, json_encode($links, JSON_PRETTY_PRINT));
}

// Handle GET request - return all links
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $links = loadLinks();
    echo json_encode([
        'success' => true,
        'links' => $links
    ]);
    exit;
}

// Handle POST request - add, update, or delete
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['action'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid request']);
        exit;
    }
    
    $links = loadLinks();
    
    switch ($input['action']) {
        case 'add':
            if (!isset($input['link'])) {
                echo json_encode(['success' => false, 'error' => 'Missing link data']);
                exit;
            }
            
            $newLink = [
                'id' => $input['link']['id'],
                'title' => htmlspecialchars($input['link']['title']),
                'url' => filter_var($input['link']['url'], FILTER_SANITIZE_URL)
            ];
            
            $links[] = $newLink;
            
            if (saveLinks($links)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to save']);
            }
            break;
            
        case 'update':
            if (!isset($input['id']) || !isset($input['title']) || !isset($input['url'])) {
                echo json_encode(['success' => false, 'error' => 'Missing data']);
                exit;
            }
            
            $updated = false;
            for ($i = 0; $i < count($links); $i++) {
                if ($links[$i]['id'] == $input['id']) {
                    $links[$i]['title'] = htmlspecialchars($input['title']);
                    $links[$i]['url'] = filter_var($input['url'], FILTER_SANITIZE_URL);
                    $updated = true;
                    break;
                }
            }
            
            if ($updated && saveLinks($links)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to update']);
            }
            break;
            
        case 'delete':
            if (!isset($input['id'])) {
                echo json_encode(['success' => false, 'error' => 'Missing ID']);
                exit;
            }
            
            $links = array_filter($links, function($link) use ($input) {
                return $link['id'] != $input['id'];
            });
            
            // Re-index array
            $links = array_values($links);
            
            if (saveLinks($links)) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to delete']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Unknown action']);
    }
    
    exit;
}

echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>