# Migration

##
    nginx:  
        location ~ /(?:css|image|js|lib)/ ->
        location ~ /(?:modules)/

    ftp copy config.json files.
