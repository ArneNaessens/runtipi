import { SlideFade, VStack, Flex, Divider, useDisclosure, useToast } from '@chakra-ui/react';
import React from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { AppConfig } from '@runtipi/common';
import { useAppsStore } from '../../../state/appsStore';
import { useSytemStore } from '../../../state/systemStore';
import AppActions from '../components/AppActions';
import InstallModal from '../components/InstallModal';
import StopModal from '../components/StopModal';
import UninstallModal from '../components/UninstallModal';
import UpdateModal from '../components/UpdateModal';
import AppLogo from '../../../components/AppLogo/AppLogo';
import Markdown from '../../../components/Markdown/Markdown';

interface IProps {
  app: AppConfig;
}

const AppDetails: React.FC<IProps> = ({ app }) => {
  const toast = useToast();
  const installDisclosure = useDisclosure();
  const uninstallDisclosure = useDisclosure();
  const stopDisclosure = useDisclosure();
  const updateDisclosure = useDisclosure();

  const { install, update, uninstall, stop, start, fetchApp } = useAppsStore();
  const { internalIp } = useSytemStore();

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        position: 'top',
        isClosable: true,
      });
      fetchApp(app.id);
    }
  };

  const handleInstallSubmit = async (values: Record<string, any>) => {
    installDisclosure.onClose();
    try {
      await install(app.id, values);
    } catch (error) {
      handleError(error);
    }
  };

  const handleUnistallSubmit = async () => {
    uninstallDisclosure.onClose();
    try {
      await uninstall(app.id);
    } catch (error) {
      handleError(error);
    }
  };

  const handleStopSubmit = async () => {
    stopDisclosure.onClose();
    try {
      await stop(app.id);
    } catch (error) {
      handleError(error);
    }
  };

  const handleStartSubmit = async () => {
    try {
      await start(app.id);
    } catch (e: unknown) {
      handleError(e);
    }
  };

  const handleUpdateSubmit = async (values: Record<string, any>) => {
    try {
      await update(app.id, values);
      toast({
        title: 'Success',
        description: 'App config updated successfully',
        position: 'top',
        status: 'success',
      });
      updateDisclosure.onClose();
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpen = () => {
    window.open(`http://${internalIp}:${app.port}${app.url_suffix || ''}`, '_blank', 'noreferrer');
  };

  return (
    <SlideFade in className="flex flex-1" offsetY="20px">
      <div className="flex flex-1  p-4 mt-3 rounded-lg flex-col">
        <Flex className="flex-col md:flex-row">
          <AppLogo src={app?.image} size={180} className="self-center sm:self-auto" alt={app.name} />
          <VStack align="flex-start" justify="space-between" className="ml-0 md:ml-4">
            <div className="mt-3 items-center self-center flex flex-col sm:items-start sm:self-start md:mt-0">
              <h1 className="font-bold text-2xl">{app?.name}</h1>
              <h2 className="text-center md:text-left">{app?.short_desc}</h2>
              {app.source && (
                <a target="_blank" rel="noreferrer" className="text-blue-500 text-xs" href={app?.source}>
                  <Flex className="mt-2 items-center">
                    Source
                    <FiExternalLink className="ml-1" />
                  </Flex>
                </a>
              )}
              <p className="text-xs text-gray-600">By {app?.author}</p>
            </div>
            <div className="flex justify-center xs:absolute md:static top-0 right-5 self-center sm:self-auto">
              <AppActions
                onUpdate={updateDisclosure.onOpen}
                onOpen={handleOpen}
                onStart={handleStartSubmit}
                onStop={stopDisclosure.onOpen}
                onUninstall={uninstallDisclosure.onOpen}
                onInstall={installDisclosure.onOpen}
                app={app}
              />
            </div>
          </VStack>
        </Flex>
        <Divider className="mt-5" />
        <Markdown className="mt-3">{app?.description}</Markdown>
        <InstallModal onSubmit={handleInstallSubmit} isOpen={installDisclosure.isOpen} onClose={installDisclosure.onClose} app={app} />
        <UninstallModal onConfirm={handleUnistallSubmit} isOpen={uninstallDisclosure.isOpen} onClose={uninstallDisclosure.onClose} app={app} />
        <StopModal onConfirm={handleStopSubmit} isOpen={stopDisclosure.isOpen} onClose={stopDisclosure.onClose} app={app} />
        <UpdateModal onSubmit={handleUpdateSubmit} isOpen={updateDisclosure.isOpen} onClose={updateDisclosure.onClose} app={app} />
      </div>
    </SlideFade>
  );
};

export default AppDetails;
