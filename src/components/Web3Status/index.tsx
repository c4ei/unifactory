import { AbstractConnector } from '@web3-react/abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { darken, lighten } from 'polished'
import React, { useMemo } from 'react'
import { Activity } from 'react-feather'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
// import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg';
// import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg';
import {
  injected,
  // walletconnect,
  // walletlink
} from '../../connectors'
import { NetworkContextName } from '../../constants'
import useENSName from '../../hooks/useENSName'
import { useWalletModalToggle } from '../../state/application/hooks'
import { isTransactionRecent, useAllTransactions } from '../../state/transactions/hooks'
import { TransactionDetails } from '../../state/transactions/reducer'
import { shortenAddress } from '../../utils'
import { ButtonSecondary } from '../Button'

import Identicon from '../Identicon'
import Loader from '../Loader'

import { RowBetween } from '../Row'
import WalletModal from '../WalletModal'

// const IconWrapper = styled.div<{ size?: number }>`
//   ${({ theme }) => theme.flexColumnNoWrap};
//   align-items: center;
//   justify-content: center;
//   & > * {
//     height: ${({ size }) => (size ? size + 'px' : '32px')};
//     width: ${({ size }) => (size ? size + 'px' : '32px')};
//   }
// `;

const Web3StatusGeneric = styled(ButtonSecondary)`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  align-items: center;
  padding: 0.4rem;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`

const Web3StatusError = styled.div`
  margin-bottom: 1rem;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.red1};
  color: ${({ theme }) => theme.red1};
  font-weight: 500;
  overflow-wrap: break-word;
`

const ErrorStatusTitle = styled.h3`
  margin: 0;
  margin-bottom: 0.7rem;
  align-items: center;
  display: flex;
  font-weight: 500;
`

const ErrorStatusDescription = styled.p`
  margin: 0;
  text-align: center;
`

const Web3StatusConnect = styled(Web3StatusGeneric)<{ faded?: boolean }>`
  background-color: ${({ theme }) => theme.primary1};
  border: 1px solid transparent;
  color: ${({ theme }) => theme.white1};
  font-weight: 500;

  :hover,
  :focus {
    border: 1px solid ${({ theme }) => darken(0.05, theme.primary1)};
    color: ${({ theme }) => theme.white1};
  }

  ${({ faded }) =>
    faded &&
    css`
      background-color: ${({ theme }) => theme.primary4};
      border: 1px solid ${({ theme }) => theme.primary4};
      color: ${({ theme }) => theme.white1};

      :hover,
      :focus {
        border: 1px solid ${({ theme }) => darken(0.05, theme.primary1)};
        color: ${({ theme }) => darken(0.05, theme.white1)};
      }
    `}
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{ pending?: boolean }>`
  background-color: ${({ pending, theme }) => (pending ? theme.primary1 : theme.bg1)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.primary1 : theme.bg3)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.text1)};
  font-weight: 500;
  :hover,
  :focus {
    background-color: ${({ pending, theme }) => (pending ? darken(0.05, theme.primary1) : lighten(0.05, theme.bg2))};

    :focus {
      border: 1px solid ${({ pending, theme }) => (pending ? darken(0.1, theme.primary1) : darken(0.1, theme.bg3))};
    }
  }
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.3rem;
  width: fit-content;
  font-weight: 500;
`

const NetworkIcon = styled(Activity)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  width: 20px;
  height: 20px;
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

// eslint-disable-next-line react/prop-types
function StatusIcon({ connector }: { connector: AbstractConnector }) {
  if (connector === injected) {
    return <Identicon />
  }
  // * see connectors directory
  // else if (connector === walletconnect) {
  //   return (
  //     <IconWrapper size={16}>
  //       <img src={WalletConnectIcon} alt={''} />
  //     </IconWrapper>
  //   );
  // } else if (connector === walletlink) {
  //   return (
  //     <IconWrapper size={16}>
  //       <img src={CoinbaseWalletIcon} alt={''} />
  //     </IconWrapper>
  //   );
  // }
  return null
}

function Web3StatusInner() {
  const { t } = useTranslation()
  const { account, connector, error, deactivate } = useWeb3React()

  const { ENSName } = useENSName(account ?? undefined)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)

  const hasPendingTransactions = !!pending.length
  const toggleWalletModal = useWalletModalToggle()
  const disconnect = () => deactivate()

  if (account) {
    return (
      <Web3StatusConnected id="web3-status-connected" onClick={toggleWalletModal} pending={hasPendingTransactions}>
        {hasPendingTransactions ? (
          <RowBetween>
            <Text>
              {pending?.length} {t('pending')}
            </Text>{' '}
            <Loader stroke="white" />
          </RowBetween>
        ) : (
          <>
            <Text>{ENSName || shortenAddress(account)}</Text>
          </>
        )}
        {!hasPendingTransactions && connector && <StatusIcon connector={connector} />}
      </Web3StatusConnected>
    )
  } else if (error) {
    return (
      <>
        <Web3StatusError>
          <ErrorStatusTitle>
            <NetworkIcon />
            <span>{error instanceof UnsupportedChainIdError ? t('wrongNetwork') : t('error')}</span>
          </ErrorStatusTitle>

          <ErrorStatusDescription>{t('pleaseChangeWrongNetwork')}</ErrorStatusDescription>
        </Web3StatusError>

        <Web3StatusConnect onClick={disconnect}>{t('disconnect')}</Web3StatusConnect>
      </>
    )
  } else {
    return (
      <Web3StatusConnect id="connect-wallet" onClick={toggleWalletModal} faded={!account}>
        <Text>{t('connectWallet')}</Text>
      </Web3StatusConnect>
    )
  }
}

export default function Web3Status() {
  const { active, account } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)
  const { ENSName } = useENSName(account ?? undefined)
  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)
  const confirmed = sortedRecentTransactions.filter((tx) => tx.receipt).map((tx) => tx.hash)

  if (!contextNetwork.active && !active) {
    return null
  }

  return (
    <>
      <Web3StatusInner />
      <WalletModal ENSName={ENSName ?? undefined} pendingTransactions={pending} confirmedTransactions={confirmed} />
    </>
  )
}
