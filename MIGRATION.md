# Migration

##
    nginx:  
        location ~ /(?:css|image|js|lib)/ ->
            location /modules/ {
            }

            location /modules/bower/ {
              alias /Users/drypot/projects/sleek/website/bower_components/;
            }

    ftp copy config.json files.
