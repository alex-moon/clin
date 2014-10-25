from fabric.api import sudo, local, cd
from fabric.colors import green, red
from fabric.operations import prompt, put
from fabric.contrib.files import exists
from fabric.operations import run

from fabconfig import *


def manage(*args):
    for command in args:
        run('source %s && %s/manage.py %s' % (env.rds_conf, env.code_dir, command))


def deploy(tag=None):
    if not exists(env.provision_flag):
        put('deploy/rds.conf', env.rds_conf)
        put('deploy/provision.sh', env.provision_script)
        sudo('sudo chmod +x %(provision_script)s && %(provision_script)s' % env)

    backup_target_database()
    archive_build()
    upload()
    unpack()
    manage('syncdb', 'migrate', 'collectstatic --noinput')
    ensure_log_folder()
    
    uwsgi()
    supervisor()
    nginx()
    

def backup_target_database():
    result = 'result'
    while result.lower() not in ['y', 'n', None]:
        result = prompt('Do you want to backup the database? [y/N]', default='n')
        if result == 'y':
            backup_db()


def ensure_log_folder():
    sudo('mkdir -p /var/log/clin/')
    sudo('chown -R root:www-data /var/log/clin/')
    sudo('chmod -R 774 /var/log/clin/')
        

def archive_build():
    branch = local('git rev-parse --abbrev-ref HEAD', capture=True)
    print green('Tarballing branch: %s' % branch)
    local('git archive --format=tar.gz %s -o %s' % (branch, env.local_tar))
    print green('Branch [%s] tarballed for transport to %s' % (branch, env.unpack_path))


def upload():
    green("Uploading tarball")
    green("Uploading %(local_tar)s to %(unpack_path)s" % env)
    put(env.local_tar, env.unpack_path)


def unpack():
    if exists(env.tmp_code_dir):
        sudo('rm -rf %(tmp_code_dir)s' % env)
    sudo("mkdir -p %(tmp_code_dir)s" % env)

    green("Unpacking tarball to %s" % env.tmp_code_dir)

    with cd(env.tmp_code_dir):
        sudo('tar xvzf %(unpack_path)s' % env)

    green("Doing pip install")
    sudo('pip install -r %(tmp_code_dir)s/deploy/requirements.txt' % env)

    green("Moving www dir into place")
    if exists(env.code_dir):
        sudo("rm -rf %(code_dir)s" % env)
    sudo('mv %(tmp_code_dir)s/www %(code_dir)s' % env)

    green("Cleaning up")
    sudo('rm -rf %(unpack_path)s %(tmp_code_dir)s' % env)


def backup_db():
    env.backup_dir = "%(base_dir)s/backups" % env
    if not exists(env.backup_dir):
        sudo("mkdir -p %(backup_dir)s" % env)

    env.db_backup = "%(backup_dir)s/clin-%(now)s.sql.gz" % env
    sudo('source %(rds_conf)s && mysqldump -h${db_host} -u${db_user} -p${db_pass} ${db_name} > %(db_backup)s' % env)
    print green('Existing database backed up to: %(db_backup)s' % env)


def uwsgi():
    put('deploy/uwsgi.ini', '/var/www/uwsgi.ini')


def supervisor():
    put('deploy/supervisor.conf', '/etc/supervisor/conf.d/clin.conf')
    sudp('service supervisor restart')


def nginx():
    put('deploy/nginx.conf', '/etc/nginx/sites-enabled/clin.conf')
    sudo('/etc/init.d/nginx restart')